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
}

interface GitHubUserResponse {
  bio: string | null
  login: string
  id: number
  name: string | null
}

async function fetchGitHubProfile(username: string): Promise<string> {
  const url = `https://github.com/${username}`
  console.log(`[MVP Auth] Fetching GitHub profile: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'contrails-app'
    }
  })
  
  console.log(`[MVP Auth] GitHub profile response status: ${response.status}`)
  
  if (!response.ok) {
    console.error(`[MVP Auth] GitHub profile fetch failed with status ${response.status}`)
    throw new Error(`GitHub profile request failed with status ${response.status}`)
  }
  
  const html = await response.text()
  console.log(`[MVP Auth] GitHub profile HTML length: ${html.length} characters`)
  
  return html
}

async function fetchMVPProfile(profileUrl: string): Promise<{ profile: MVPProfile; githubLinks: string[] } | null> {
  try {
    console.log(`[MVP Auth] Fetching MVP profile: ${profileUrl}`)
    
    const response = await fetch(profileUrl)
    console.log(`[MVP Auth] MVP profile response status: ${response.status}`)
    
    if (!response.ok) {
      console.error(`[MVP Auth] MVP profile fetch failed with status ${response.status}`)
      throw new Error(`MVP profile request failed with status ${response.status}`)
    }
    
    const html = await response.text()
    console.log(`[MVP Auth] MVP profile HTML length: ${html.length} characters`)
    
    const displayNameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'Unknown'
    console.log(`[MVP Auth] Detected display name: "${displayName}"`)
    
    const awardCategoryMatch = html.match(/Award Category[:\s]*([^<]+)/)
    const awardCategory = awardCategoryMatch ? awardCategoryMatch[1].trim() : 'Unknown'
    console.log(`[MVP Auth] Detected award category: "${awardCategory}"`)
    
    const activities: string[] = []
    const activityMatches = html.matchAll(/activity[^>]*>([^<]+)/gi)
    for (const match of activityMatches) {
      activities.push(match[1].trim())
    }
    console.log(`[MVP Auth] Detected ${activities.length} activities`)
    
    const githubLinks: string[] = []
    const githubLinkMatches = html.matchAll(/https?:\/\/github\.com\/([a-zA-Z0-9_-]+)/gi)
    for (const match of githubLinkMatches) {
      if (!githubLinks.includes(match[0])) {
        githubLinks.push(match[0])
        console.log(`[MVP Auth] Found GitHub link on MVP profile: ${match[0]}`)
      }
    }
    console.log(`[MVP Auth] Total unique GitHub links found: ${githubLinks.length}`)
    
    return {
      profile: {
        displayName,
        awardCategory,
        activities
      },
      githubLinks
    }
  } catch (error) {
    console.error(`[MVP Auth] Error fetching MVP profile:`, error)
    return null
  }
}

function extractMVPProfileUrl(text: string): string | null {
  console.log(`[MVP Auth] Searching for MVP profile URL in text of length: ${text.length}`)
  
  const mvpUrlMatch = text.match(/https?:\/\/mvp\.microsoft\.com\/[^\s"'<>]+/)
  
  if (mvpUrlMatch) {
    console.log(`[MVP Auth] Found MVP profile URL: ${mvpUrlMatch[0]}`)
  } else {
    console.log(`[MVP Auth] No MVP profile URL found in text`)
    const snippet = text.substring(0, 500)
    console.log(`[MVP Auth] First 500 characters of text: ${snippet}`)
  }
  
  return mvpUrlMatch ? mvpUrlMatch[0] : null
}

export async function verifyMVPAccess(githubUsername: string): Promise<MVPVerificationResult> {
  console.log(`[MVP Auth] ========== Starting verification for user: ${githubUsername} ==========`)
  
  const checks: VerificationChecks = {
    hasMVPUrlOnGitHub: false,
    hasValidMVPProfile: false,
    isSecurityMVP: false,
    hasGitHubOnMVPProfile: false
  }
  
  let detectedMVPUrl: string | undefined
  let detectedGitHubLinks: string[] = []
  let mvpProfile: MVPProfile | undefined
  
  try {
    console.log(`[MVP Auth] Step 1: Fetching GitHub profile...`)
    const githubProfileHtml = await fetchGitHubProfile(githubUsername)
    
    console.log(`[MVP Auth] Step 2: Extracting MVP profile URL from GitHub profile...`)
    const mvpProfileUrl = extractMVPProfileUrl(githubProfileHtml)
    if (mvpProfileUrl) {
      checks.hasMVPUrlOnGitHub = true
      detectedMVPUrl = mvpProfileUrl
      console.log(`[MVP Auth] ✓ Check 1 PASSED: MVP URL found on GitHub profile`)
    } else {
      console.log(`[MVP Auth] ✗ Check 1 FAILED: No MVP URL found on GitHub profile`)
    }
    
    if (mvpProfileUrl) {
      console.log(`[MVP Auth] Step 3: Fetching MVP profile data...`)
      const mvpData = await fetchMVPProfile(mvpProfileUrl)
      if (mvpData) {
        checks.hasValidMVPProfile = true
        mvpProfile = mvpData.profile
        detectedGitHubLinks = mvpData.githubLinks
        console.log(`[MVP Auth] ✓ Check 2 PASSED: MVP profile is accessible`)
        
        console.log(`[MVP Auth] Step 4: Checking award category...`)
        console.log(`[MVP Auth] Award category detected: "${mvpData.profile.awardCategory}"`)
        if (mvpData.profile.awardCategory === 'Security') {
          checks.isSecurityMVP = true
          console.log(`[MVP Auth] ✓ Check 3 PASSED: Award category is Security`)
        } else {
          console.log(`[MVP Auth] ✗ Check 3 FAILED: Award category is "${mvpData.profile.awardCategory}", expected "Security"`)
        }
        
        console.log(`[MVP Auth] Step 5: Checking for GitHub profile on MVP profile...`)
        const normalizedUsername = githubUsername.toLowerCase()
        console.log(`[MVP Auth] Looking for GitHub username: "${normalizedUsername}"`)
        console.log(`[MVP Auth] GitHub links found on MVP profile:`, mvpData.githubLinks)
        
        const hasMatchingGitHubLink = mvpData.githubLinks.some((link: string) => {
          const linkLower = link.toLowerCase()
          const matches = linkLower.includes('github.com/' + normalizedUsername)
          console.log(`[MVP Auth] Checking link "${link}" - matches: ${matches}`)
          return matches
        })
        
        if (hasMatchingGitHubLink) {
          checks.hasGitHubOnMVPProfile = true
          console.log(`[MVP Auth] ✓ Check 4 PASSED: GitHub profile found on MVP profile`)
        } else {
          console.log(`[MVP Auth] ✗ Check 4 FAILED: GitHub profile not found on MVP profile`)
        }
      } else {
        console.log(`[MVP Auth] ✗ Check 2 FAILED: Could not access or parse MVP profile`)
      }
    } else {
      console.log(`[MVP Auth] Skipping MVP profile checks (no MVP URL found on GitHub)`)
    }
    
    const isVerified = checks.hasMVPUrlOnGitHub && 
                      checks.hasValidMVPProfile && 
                      checks.isSecurityMVP && 
                      checks.hasGitHubOnMVPProfile
    
    console.log(`[MVP Auth] ========== Verification Summary ==========`)
    console.log(`[MVP Auth] MVP URL on GitHub: ${checks.hasMVPUrlOnGitHub ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] Valid MVP Profile: ${checks.hasValidMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] Security MVP: ${checks.isSecurityMVP ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] GitHub on MVP Profile: ${checks.hasGitHubOnMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] FINAL RESULT: ${isVerified ? '✓ VERIFIED' : '✗ NOT VERIFIED'}`)
    console.log(`[MVP Auth] ===========================================`)
    
    if (!isVerified) {
      let errorMessages: string[] = []
      
      if (!checks.hasMVPUrlOnGitHub) {
        errorMessages.push('No Microsoft MVP profile link found on your GitHub profile')
      }
      if (!checks.hasValidMVPProfile) {
        errorMessages.push('Unable to access or validate your MVP profile')
      }
      if (checks.hasValidMVPProfile && !checks.isSecurityMVP) {
        errorMessages.push('Your MVP Award Category must be "Security"')
      }
      if (checks.hasValidMVPProfile && !checks.hasGitHubOnMVPProfile) {
        errorMessages.push('Your GitHub profile URL was not found on your MVP profile')
      }
      
      return {
        isVerified: false,
        error: errorMessages.join('. '),
        detectedMVPUrl,
        detectedGitHubLinks,
        checks
      }
    }
    
    return {
      isVerified: true,
      profile: mvpProfile,
      detectedMVPUrl,
      detectedGitHubLinks,
      checks
    }
  } catch (error) {
    console.error(`[MVP Auth] ✗ UNEXPECTED ERROR during verification:`, error)
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.',
      checks
    }
  }
}
