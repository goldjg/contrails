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
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'contrails-app'
    }
  })
  if (!response.ok) {
    throw new Error(`GitHub profile request failed with status ${response.status}`)
  }
  const html = await response.text()
  return html
}

async function fetchMVPProfile(profileUrl: string): Promise<{ profile: MVPProfile; githubLinks: string[] } | null> {
  try {
    const response = await fetch(profileUrl)
    if (!response.ok) {
      throw new Error(`MVP profile request failed with status ${response.status}`)
    }
    const html = await response.text()
    
    const displayNameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'Unknown'
    
    const awardCategoryMatch = html.match(/Award Category[:\s]*([^<]+)/)
    const awardCategory = awardCategoryMatch ? awardCategoryMatch[1].trim() : 'Unknown'
    
    const activities: string[] = []
    const activityMatches = html.matchAll(/activity[^>]*>([^<]+)/gi)
    for (const match of activityMatches) {
      activities.push(match[1].trim())
    }
    
    const githubLinks: string[] = []
    const githubLinkMatches = html.matchAll(/https?:\/\/github\.com\/([a-zA-Z0-9_-]+)/gi)
    for (const match of githubLinkMatches) {
      if (!githubLinks.includes(match[0])) {
        githubLinks.push(match[0])
      }
    }
    
    return {
      profile: {
        displayName,
        awardCategory,
        activities
      },
      githubLinks
    }
  } catch (error) {
    return null
  }
}

function extractMVPProfileUrl(text: string): string | null {
  const mvpUrlMatch = text.match(/https?:\/\/mvp\.microsoft\.com\/[^\s]+/)
  return mvpUrlMatch ? mvpUrlMatch[0] : null
}

export async function verifyMVPAccess(githubUsername: string): Promise<MVPVerificationResult> {
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
    const githubProfileHtml = await fetchGitHubProfile(githubUsername)
    
    const mvpProfileUrl = extractMVPProfileUrl(githubProfileHtml)
    if (mvpProfileUrl) {
      checks.hasMVPUrlOnGitHub = true
      detectedMVPUrl = mvpProfileUrl
    }
    
    if (mvpProfileUrl) {
      const mvpData = await fetchMVPProfile(mvpProfileUrl)
      if (mvpData) {
        checks.hasValidMVPProfile = true
        mvpProfile = mvpData.profile
        detectedGitHubLinks = mvpData.githubLinks
        
        if (mvpData.profile.awardCategory === 'Security') {
          checks.isSecurityMVP = true
        }
        
        const normalizedUsername = githubUsername.toLowerCase()
        const hasMatchingGitHubLink = mvpData.githubLinks.some((link: string) => 
          link.toLowerCase().includes('github.com/' + normalizedUsername)
        )
        if (hasMatchingGitHubLink) {
          checks.hasGitHubOnMVPProfile = true
        }
      }
    }
    
    const isVerified = checks.hasMVPUrlOnGitHub && 
                      checks.hasValidMVPProfile && 
                      checks.isSecurityMVP && 
                      checks.hasGitHubOnMVPProfile
    
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
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.',
      checks
    }
  }
}
