export interface MVPProfile {
  displayName: string
  awardCategory: string
  activities: string[]
}

export interface VerificationChecks {
  hasMVPUrlOnGitHub: boolean
  hasValidMVPProfile: boolean
  isSecurityMVP: boolean
  hasGitHubOnMVPProfile: boolean
}

export interface MVPVerificationResult {
  isVerified: boolean
  profile?: MVPProfile
  error?: string
  detectedMVPUrl?: string
  detectedGitHubLinks?: string[]
  checks?: VerificationChecks
  displayName?: string
}

export type VerificationStep = 
  | 'fetching-github'
  | 'extracting-mvp-url'
  | 'fetching-mvp-profile'
  | 'validating-category'
  | 'checking-github-link'
  | 'complete'

export type ProgressCallback = (step: VerificationStep, message: string) => void

interface GitHubUser {
  bio: string | null
  blog: string | null
  twitter_username: string | null
  company: string | null
  location: string | null
  name: string | null
  login: string
  html_url: string
  social_accounts?: Array<{ provider: string; url: string }>
}

async function fetchGitHubProfile(username: string): Promise<GitHubUser> {
  console.log(`[MVP Auth] Fetching GitHub user data for: ${username}`)
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    console.log(`[MVP Auth] GitHub API response status: ${response.status}`)
    
    if (!response.ok) {
      console.error(`[MVP Auth] GitHub API request failed with status ${response.status}`)
      throw new Error(`GitHub API request failed with status ${response.status}`)
    }
    
    const userData: GitHubUser = await response.json()
    console.log(`[MVP Auth] GitHub user data retrieved:`, {
      bio: userData.bio?.substring(0, 100),
      blog: userData.blog,
      socialAccounts: userData.social_accounts?.length || 0
    })
    
    return userData
  } catch (error) {
    console.error(`[MVP Auth] Error fetching GitHub profile:`, error)
    throw error
  }
}

function extractMVPProfileUrl(userData: GitHubUser): string | null {
  console.log(`[MVP Auth] Searching for MVP profile URL in GitHub user data`)
  
  const textsToSearch: string[] = []
  
  if (userData.bio) textsToSearch.push(userData.bio)
  if (userData.blog) textsToSearch.push(userData.blog)
  if (userData.company) textsToSearch.push(userData.company)
  if (userData.location) textsToSearch.push(userData.location)
  if (userData.social_accounts) {
    userData.social_accounts.forEach(account => textsToSearch.push(account.url))
  }
  
  for (const text of textsToSearch) {
    const mvpUrlMatch = text.match(/https?:\/\/mvp\.microsoft\.com\/[^\s"'<>]+/)
    if (mvpUrlMatch) {
      console.log(`[MVP Auth] Found MVP profile URL: ${mvpUrlMatch[0]}`)
      return mvpUrlMatch[0]
    }
  }
  
  console.log(`[MVP Auth] No MVP profile URL found in GitHub user data`)
  console.log(`[MVP Auth] Searched in:`, textsToSearch)
  
  return null
}

async function fetchMVPProfile(mvpProfileUrl: string, githubUsername: string): Promise<{
  isValid: boolean
  isSecurityMVP: boolean
  hasGitHubLink: boolean
  displayName?: string
  awardCategory?: string
  detectedGitHubLinks?: string[]
}> {
  console.log(`[MVP Auth] Fetching MVP profile page: ${mvpProfileUrl}`)

  let html: string | null = null

  // Try a direct fetch first (works if the server sends permissive CORS headers)
  try {
    const response = await fetch(mvpProfileUrl, {
      headers: { Accept: 'text/html,application/xhtml+xml' }
    })
    if (response.ok) {
      html = await response.text()
      console.log(`[MVP Auth] Direct fetch succeeded (${html.length} bytes)`)
    } else {
      console.log(`[MVP Auth] Direct fetch returned HTTP ${response.status}, trying CORS proxy`)
    }
  } catch (err) {
    console.log(`[MVP Auth] Direct fetch failed (likely CORS), trying proxy...`, err)
  }

  // Fall back to a CORS proxy.
  // Note: the MVP profile URL is passed to api.allorigins.win so that service can
  // see which URL is being proxied. The profile pages are already public, so no
  // private data is disclosed beyond what anyone can view in a browser.
  if (!html) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mvpProfileUrl)}`
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const data = await response.json() as { contents: string; status: { http_code: number } }
        if (data.status?.http_code === 200 && data.contents) {
          html = data.contents
          console.log(`[MVP Auth] Proxy fetch succeeded (${html.length} bytes)`)
        } else {
          console.log(`[MVP Auth] Proxy returned HTTP ${data.status?.http_code}`)
        }
      }
    } catch (err) {
      console.error(`[MVP Auth] Proxy fetch also failed:`, err)
    }
  }

  if (!html) {
    console.error(`[MVP Auth] Could not retrieve MVP profile page`)
    return { isValid: false, isSecurityMVP: false, hasGitHubLink: false }
  }

  // ── Parse HTML ──────────────────────────────────────────────────────────────
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 1. Display name – try og:title, then h1, then __NEXT_DATA__ JSON
  let displayName = ''
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (ogTitle) {
    displayName = ogTitle.replace(/\s*\|.*$/, '').trim()
  } else {
    displayName = doc.querySelector('h1')?.textContent?.trim() ?? ''
  }
  if (!displayName) {
    const m = /"(?:displayName|fullName|name)"\s*:\s*"([^"]+)"/i.exec(html)
    if (m) displayName = m[1].trim()
  }

  // 2. Award category – check embedded JSON first, then HTML text
  let awardCategory = ''
  const categoryJsonPatterns = [
    /"awardCategory(?:Name)?"\s*:\s*"([^"]+)"/i,
    /"mvpCategory"\s*:\s*"([^"]+)"/i,
  ]
  for (const pattern of categoryJsonPatterns) {
    const m = html.match(pattern)
    if (m) { awardCategory = m[1].trim(); break }
  }
  if (!awardCategory) {
    // Look for the text "Award Category" followed closely by a value in the DOM.
    // Exclude div to avoid matching large containers; use leaf elements only.
    const labelEls = doc.querySelectorAll('span, dt, p, td, th, li, label')
    labelEls.forEach(el => {
      if (awardCategory) return
      // True leaf: no child elements (may still have text nodes)
      if (el.children.length !== 0) return
      const text = el.textContent?.trim() ?? ''
      if (/^award\s+category$/i.test(text)) {
        const next = el.nextElementSibling ?? el.parentElement?.nextElementSibling
        const val = next?.textContent?.trim()
        if (val) awardCategory = val
      }
    })
  }

  const isSecurityMVP = awardCategory.toLowerCase().includes('security') ||
    // Broad fallback: look for "Security" appearing as a standalone award category in any JSON
    /"(?:awardCategory(?:Name)?|mvpCategory|category)"\s*:\s*"[^"]*security[^"]*"/i.test(html)

  // 3. GitHub links – collect via the regex scan (which already requires the full
  //    github.com hostname at the start of the URL) and deduplicate via a Set.
  const githubLinks = new Set<string>()
  const ghPattern = /https?:\/\/(?:www\.)?github\.com\/[^\s"'<>,)]+/gi
  for (const m of html.matchAll(ghPattern)) {
    githubLinks.add(m[0].replace(/\/+$/, ''))
  }

  const githubLinksArr = [...githubLinks]
  // Match only when the username is immediately followed by '/', end-of-string,
  // or a query/fragment character – prevents 'test' matching 'testing'.
  // GitHub usernames only contain [a-zA-Z0-9-], none of which are regex special
  // characters, so no escaping is needed.
  const usernameSegmentRe = new RegExp(
    `github\\.com/${githubUsername}(?:/|$|[?#])`,
    'i'
  )
  const hasGitHubLink = githubLinksArr.some(link => usernameSegmentRe.test(link))

  console.log(`[MVP Auth] Parsed MVP profile:`, {
    displayName,
    awardCategory,
    isSecurityMVP,
    hasGitHubLink,
    githubLinksFound: githubLinksArr.length
  })

  return {
    isValid: true,
    isSecurityMVP,
    hasGitHubLink,
    displayName,
    awardCategory,
    detectedGitHubLinks: githubLinksArr
  }
}

export async function verifyMVPAccess(
  githubUsername: string,
  onProgress?: ProgressCallback
): Promise<MVPVerificationResult> {
  console.log(`[MVP Auth] ========== Starting verification for user: ${githubUsername} ==========`)
  
  const checks: VerificationChecks = {
    hasMVPUrlOnGitHub: false,
    hasValidMVPProfile: false,
    isSecurityMVP: false,
    hasGitHubOnMVPProfile: false
  }
  
  let detectedMVPUrl: string | undefined
  let detectedGitHubLinks: string[] | undefined
  
  try {
    console.log(`[MVP Auth] Step 1: Fetching GitHub user data...`)
    onProgress?.('fetching-github', `Fetching GitHub profile for @${githubUsername}`)
    
    let githubUserData: GitHubUser
    try {
      githubUserData = await fetchGitHubProfile(githubUsername)
    } catch (error) {
      console.error(`[MVP Auth] FATAL: Cannot fetch GitHub user data`)
      onProgress?.('complete', 'Verification failed')
      return {
        isVerified: false,
        error: 'Unable to fetch GitHub profile data. Please try again later.',
        checks
      }
    }
    
    console.log(`[MVP Auth] Step 2: Extracting MVP profile URL from GitHub profile...`)
    onProgress?.('extracting-mvp-url', 'Searching for MVP profile URL on GitHub')
    
    const mvpProfileUrl = extractMVPProfileUrl(githubUserData)
    if (mvpProfileUrl) {
      checks.hasMVPUrlOnGitHub = true
      detectedMVPUrl = mvpProfileUrl
      console.log(`[MVP Auth] ✓ Check 1 PASSED: MVP URL found on GitHub profile`)
      
      console.log(`[MVP Auth] Step 3: Fetching MVP profile page...`)
      onProgress?.('fetching-mvp-profile', 'Reading MVP profile page')
      
      const mvpData = await fetchMVPProfile(mvpProfileUrl, githubUsername)
      
      if (mvpData.isValid) {
        checks.hasValidMVPProfile = true
        console.log(`[MVP Auth] ✓ Check 2 PASSED: MVP profile is valid and accessible`)
        
        onProgress?.('validating-category', 'Validating Security MVP status')
        
        if (mvpData.isSecurityMVP) {
          checks.isSecurityMVP = true
          console.log(`[MVP Auth] ✓ Check 3 PASSED: Award Category is Security`)
        } else {
          console.log(`[MVP Auth] ✗ Check 3 FAILED: Award Category is "${mvpData.awardCategory}", not Security`)
        }
        
        onProgress?.('checking-github-link', 'Verifying GitHub profile link')
        
        if (mvpData.hasGitHubLink) {
          checks.hasGitHubOnMVPProfile = true
          detectedGitHubLinks = mvpData.detectedGitHubLinks
          console.log(`[MVP Auth] ✓ Check 4 PASSED: GitHub profile link found on MVP profile`)
        } else {
          console.log(`[MVP Auth] ✗ Check 4 FAILED: GitHub profile link not found on MVP profile`)
          if (mvpData.detectedGitHubLinks && mvpData.detectedGitHubLinks.length > 0) {
            console.log(`[MVP Auth] GitHub links found (but not matching):`, mvpData.detectedGitHubLinks)
            detectedGitHubLinks = mvpData.detectedGitHubLinks
          }
        }
        
        onProgress?.('complete', 'Verification complete')
        
        const allChecksPassed = checks.hasMVPUrlOnGitHub && 
                               checks.hasValidMVPProfile && 
                               checks.isSecurityMVP && 
                               checks.hasGitHubOnMVPProfile
        
        console.log(`[MVP Auth] ========== Verification Summary ==========`)
        console.log(`[MVP Auth] MVP URL on GitHub: ${checks.hasMVPUrlOnGitHub ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] MVP Profile Valid: ${checks.hasValidMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] Security MVP: ${checks.isSecurityMVP ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] GitHub on MVP: ${checks.hasGitHubOnMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] FINAL RESULT: ${allChecksPassed ? '✓ VERIFIED' : '✗ NOT VERIFIED'}`)
        console.log(`[MVP Auth] ===========================================`)
        
        if (allChecksPassed) {
          return {
            isVerified: true,
            detectedMVPUrl,
            detectedGitHubLinks,
            displayName: mvpData.displayName,
            checks,
            profile: {
              displayName: mvpData.displayName || githubUserData.name || githubUsername,
              awardCategory: mvpData.awardCategory || 'Security',
              activities: []
            }
          }
        } else {
          return {
            isVerified: false,
            error: 'Verification incomplete. Please check all requirements.',
            detectedMVPUrl,
            detectedGitHubLinks,
            checks
          }
        }
      } else {
        console.log(`[MVP Auth] ✗ Check 2 FAILED: MVP profile could not be verified`)
        onProgress?.('complete', 'Verification failed')
      }
    } else {
      console.log(`[MVP Auth] ✗ Check 1 FAILED: No MVP URL found on GitHub profile`)
      onProgress?.('complete', 'Verification failed')
    }
    
    console.log(`[MVP Auth] ========== Verification Summary ==========`)
    console.log(`[MVP Auth] MVP URL on GitHub: ${checks.hasMVPUrlOnGitHub ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] MVP Profile Valid: ${checks.hasValidMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] Security MVP: ${checks.isSecurityMVP ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] GitHub on MVP: ${checks.hasGitHubOnMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] FINAL RESULT: ✗ NOT VERIFIED`)
    console.log(`[MVP Auth] ===========================================`)
    
    return {
      isVerified: false,
      error: 'Verification failed. Please ensure all requirements are met.',
      detectedMVPUrl,
      detectedGitHubLinks,
      checks
    }
  } catch (error) {
    console.error(`[MVP Auth] ✗ UNEXPECTED ERROR during verification:`, error)
    onProgress?.('complete', 'Verification error')
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.',
      checks
    }
  }
}
