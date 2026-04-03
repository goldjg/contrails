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
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}`)
    }
    
    const userData: GitHubUser = await response.json()
    return userData
  } catch (error) {
    throw error
  }
}

const MVP_URL_PATTERN = /https?:\/\/mvp\.microsoft\.com\/[^\s"'<>]+/

function extractMVPProfileUrl(userData: GitHubUser): string | null {
  const textsToSearch: string[] = []
  
  if (userData.bio) textsToSearch.push(userData.bio)
  if (userData.blog) textsToSearch.push(userData.blog)
  if (userData.company) textsToSearch.push(userData.company)
  if (userData.location) textsToSearch.push(userData.location)
  if (userData.social_accounts) {
    userData.social_accounts.forEach(account => textsToSearch.push(account.url))
  }
  
  for (const text of textsToSearch) {
    const mvpUrlMatch = text.match(MVP_URL_PATTERN)
    if (mvpUrlMatch) {
      return mvpUrlMatch[0]
    }
  }
  
  return null
}

async function extractMVPProfileUrlFromGitHubPage(githubUsername: string): Promise<string | null> {
  try {
    const response = await fetch(`https://github.com/${githubUsername}`, {
      headers: { Accept: 'text/html,application/xhtml+xml' }
    })
    if (!response.ok) {
      return null
    }
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    for (const a of Array.from(doc.querySelectorAll('a[href]'))) {
      const href = a.getAttribute('href') ?? ''
      const m = href.match(MVP_URL_PATTERN)
      if (m) {
        return m[0]
      }
    }

    const m = html.match(MVP_URL_PATTERN)
    if (m) {
      return m[0]
    }
  } catch (err) {
    return null
  }
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
  let html: string | null = null

  try {
    const response = await fetch(mvpProfileUrl, {
      headers: { Accept: 'text/html,application/xhtml+xml' }
    })
    if (response.ok) {
      html = await response.text()
    }
  } catch (err) {
    html = null
  }

  if (!html) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mvpProfileUrl)}`
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const data = await response.json()
        if (data && typeof data === 'object' && 'contents' in data && data.contents && typeof data.contents === 'string') {
          const contents = data.contents
          html = contents
        }
      }
    } catch (err) {
      html = null
    }
  }

  if (!html || typeof html !== 'string') {
    return { isValid: false, isSecurityMVP: false, hasGitHubLink: false }
  }

  // ── Parse HTML ──────────────────────────────────────────────────────────────
  const htmlString: string = html
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

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

  // 2. Award category – check embedded JSON first, then the actual DOM structure
  //    of the MVP profile page, then a raw-HTML regex fallback.
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
    // The live MVP profile page renders the award category value inside a <span>
    // with these exact inline styles (styled-components app, class names change):
    //   <span style="line-height: 22px; color: rgb(102, 102, 102); font-size: 16px;">Security</span>
    const styledSpan = doc.querySelector(
      'span[style*="color: rgb(102, 102, 102)"][style*="font-size: 16px"]'
    )
    const val = styledSpan?.textContent?.trim()
    if (val) awardCategory = val
  }
  if (!awardCategory) {
    // Raw-HTML regex for the same inline style pattern – catches cases where the
    // CORS proxy may have normalised attribute quoting or whitespace.
    const styleMatch = html.match(
      /<span[^>]*style\s*=\s*["'][^"']*color:\s*rgb\(102,\s*102,\s*102\)[^"']*font-size:\s*16px[^"']*["'][^>]*>\s*([^<]+?)\s*<\/span>/i
    ) ?? html.match(
      /<span[^>]*style\s*=\s*["'][^"']*font-size:\s*16px[^"']*color:\s*rgb\(102,\s*102,\s*102\)[^"']*["'][^>]*>\s*([^<]+?)\s*<\/span>/i
    )
    if (styleMatch) awardCategory = styleMatch[1].trim()
  }
  if (!awardCategory) {
    // Broadest fallback: look for the text "Award Category" in the DOM followed
    // by a sibling or parent-sibling element containing the value.
    const labelEls = doc.querySelectorAll('span, dt, p, td, th, li, label')
    labelEls.forEach(el => {
      if (awardCategory) return
      if (el.children.length !== 0) return
      const text = el.textContent?.trim() ?? ''
      if (/^award\s+category$/i.test(text)) {
        const next = el.nextElementSibling ?? el.parentElement?.nextElementSibling
        const nextVal = next?.textContent?.trim()
        if (nextVal) awardCategory = nextVal
      }
    })
  }

  const isSecurityMVP = awardCategory.toLowerCase().includes('security') ||
    // Broad fallback: look for "Security" appearing as a standalone award category in any JSON
    /"(?:awardCategory(?:Name)?|mvpCategory|category)"\s*:\s*"[^"]*security[^"]*"/i.test(html)

  // 3. GitHub links – three sources, all deduplicated via a Set:
  //    a) <img alt="GitHub" title="GitHub | https://github.com/username"> buttons
  //       (the actual format used on the MVP profile page social links section)
  //    b) <a href="…github.com/…"> anchor tags
  //    c) Full-URL regex scan over raw HTML
  const githubLinks = new Set<string>()

  // a) Social button images: title="GitHub | <url>"
  doc.querySelectorAll('img[alt="GitHub"][title]').forEach(img => {
    const title = img.getAttribute('title') ?? ''
    // Format: "GitHub | https://github.com/username"
    const urlMatch = title.match(/https?:\/\/(?:www\.)?github\.com\/[^\s|]+/)
    if (urlMatch) githubLinks.add(urlMatch[0].replace(/\/+$/, ''))
  })

  // b) Anchor tags whose href contains github.com
  doc.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') ?? ''
    const urlMatch = href.match(/https?:\/\/(?:www\.)?github\.com\/[^\s"'<>,)]+/)
    if (urlMatch) githubLinks.add(urlMatch[0].replace(/\/+$/, ''))
  })

  // c) Raw-HTML regex scan (catches URLs in any other attribute or text)
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
  const checks: VerificationChecks = {
    hasMVPUrlOnGitHub: false,
    hasValidMVPProfile: false,
    isSecurityMVP: false,
    hasGitHubOnMVPProfile: false
  }
  
  let detectedMVPUrl: string | undefined
  let detectedGitHubLinks: string[] | undefined
  
  try {
    onProgress?.('fetching-github', `Fetching GitHub profile for @${githubUsername}`)
    
    let githubUserData: GitHubUser
    try {
      githubUserData = await fetchGitHubProfile(githubUsername)
    } catch (error) {
      onProgress?.('complete', 'Verification failed')
      return {
        isVerified: false,
        error: 'Unable to fetch GitHub profile data. Please try again later.',
        checks
      }
    }
    
    onProgress?.('extracting-mvp-url', 'Searching for MVP profile URL on GitHub')
    
    let mvpProfileUrl = extractMVPProfileUrl(githubUserData)
    if (!mvpProfileUrl) {
      mvpProfileUrl = await extractMVPProfileUrlFromGitHubPage(githubUsername)
    }
    if (mvpProfileUrl) {
      checks.hasMVPUrlOnGitHub = true
      detectedMVPUrl = mvpProfileUrl
      
      onProgress?.('fetching-mvp-profile', 'Reading MVP profile page')
      
      const mvpData = await fetchMVPProfile(mvpProfileUrl, githubUsername)
      
      if (mvpData.isValid) {
        checks.hasValidMVPProfile = true
        
        onProgress?.('validating-category', 'Validating Security MVP status')
        
        if (mvpData.isSecurityMVP) {
          checks.isSecurityMVP = true
        }
        
        onProgress?.('checking-github-link', 'Verifying GitHub profile link')
        
        if (mvpData.hasGitHubLink) {
          checks.hasGitHubOnMVPProfile = true
          detectedGitHubLinks = mvpData.detectedGitHubLinks
        } else {
          if (mvpData.detectedGitHubLinks && mvpData.detectedGitHubLinks.length > 0) {
            detectedGitHubLinks = mvpData.detectedGitHubLinks
          }
        }
        
        onProgress?.('complete', 'Verification complete')
        
        const allChecksPassed = checks.hasMVPUrlOnGitHub && 
                               checks.hasValidMVPProfile && 
                               checks.isSecurityMVP && 
                               checks.hasGitHubOnMVPProfile
        
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
        onProgress?.('complete', 'Verification failed')
      }
    } else {
      onProgress?.('complete', 'Verification failed')
    }
    
    return {
      isVerified: false,
      error: 'Verification failed. Please ensure all requirements are met.',
      detectedMVPUrl,
      detectedGitHubLinks,
      checks
    }
  } catch (error) {
    onProgress?.('complete', 'Verification error')
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.',
      checks
    }
  }
}
