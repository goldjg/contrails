export interface MVPProfile {
  displayName: string
  awardCategory: string
  activities: string[]
}

export interface MVPVerificationResult {
  isVerified: boolean
  profile?: MVPProfile
  error?: string
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

async function fetchMVPProfile(profileUrl: string): Promise<MVPProfile | null> {
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
    
    return {
      displayName,
      awardCategory,
      activities
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
    
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
    if (!mvpProfile) {
      return {
        isVerified: false,
        error: 'Unable to verify MVP profile'
      }
    }
    
    const normalizedUsername = githubUsername.toLowerCase()
    const hasMatchingUsername = mvpProfileUrl.toLowerCase().includes(normalizedUsername)
    
    if (!hasMatchingUsername) {
      return {
        isVerified: false,
        error: 'MVP profile does not match GitHub username'
      }
    }
    
    return {
      isVerified: true,
      profile: mvpProfile
    }
  } catch (error) {
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.'
    }
  }
}
