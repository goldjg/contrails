export interface MVPProfile {
  displayName: string
  awardCategory: string
  activities: string[]
}

export interface MVPVerificationResult {
  isVerified: boolean
  profile?: MVPProfile
  error?: string
  detectedMVPUrl?: string
  detectedGitHubLinks?: string[]
}

interface GitHubUserResponse {
  bio: string | null
  login: string
  id: number
  name: string | null
}

async function fetchGitHubProfile(username: string): Promise<string> {
  const url = `https://api.github.com/users/${username}`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'contrails-app'
    }
  })
  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`)
  }
  let data: GitHubUserResponse
  try {
    data = await response.json()
  } catch {
    throw new Error('Failed to parse GitHub API response as JSON')
  }
  return data.bio || ''
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
  try {
    const githubBio = await fetchGitHubProfile(githubUsername)
    
    const mvpProfileUrl = extractMVPProfileUrl(githubBio)
    if (!mvpProfileUrl) {
      return {
        isVerified: false,
        error: 'No Microsoft MVP profile link found in GitHub bio'
      }
    }
    
    const mvpData = await fetchMVPProfile(mvpProfileUrl)
    if (!mvpData) {
      return {
        isVerified: false,
        error: 'Unable to verify MVP profile',
        detectedMVPUrl: mvpProfileUrl
      }
    }
    
    const { profile: mvpProfile, githubLinks } = mvpData
    
    if (mvpProfile.awardCategory !== 'Security') {
      return {
        isVerified: false,
        error: 'MVP Award Category must be Security',
        detectedMVPUrl: mvpProfileUrl,
        detectedGitHubLinks: githubLinks
      }
    }
    
    const normalizedUsername = githubUsername.toLowerCase()
    const hasMatchingUsername = mvpProfile.activities.some((activity: string) => 
      activity.toLowerCase().includes(normalizedUsername) || 
      activity.toLowerCase().includes('github.com/' + normalizedUsername)
    )
    
    if (!hasMatchingUsername) {
      return {
        isVerified: false,
        error: 'GitHub username not found in MVP profile activities',
        detectedMVPUrl: mvpProfileUrl,
        detectedGitHubLinks: githubLinks
      }
    }
    
    return {
      isVerified: true,
      profile: mvpProfile,
      detectedMVPUrl: mvpProfileUrl,
      detectedGitHubLinks: githubLinks
    }
  } catch (error) {
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.'
    }
  }
}
