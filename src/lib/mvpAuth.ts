export interface MVPProfile {
  displayName: string
  awardCategory: string
  activities: string[]
}

export interface MVPVerificationResult {
  isVerified: boolean
  error?: string
}

async function fetchGitHubProfile(username: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return data.bio || null
  } catch (error) {
    console.error('Error fetching GitHub profile:', error)
    return null
  }
}

async function fetchMVPProfile(url: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    
    const html = await response.text()
    
    const displayNameMatch = html.match(/<h1[^>]*class="[^"]*c-subheading[^"]*"[^>]*>\s*([^<]+)\s*<\/h1>/)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : ''
    
    const awardCategoryMatch = html.match(/<dt[^>]*>\s*Award Category\s*<\/dt>\s*<dd[^>]*>\s*([^<]+)\s*<\/dd>/i)
    const awardCategory = awardCategoryMatch ? awardCategoryMatch[1].trim() : ''
    
    const activitiesMatches = html.matchAll(/https?:\/\/github\.com\/([^"'\s<>]+)/gi)
    const activities: string[] = []
    for (const match of activitiesMatches) {
      activities.push(match[0])
    }
    
    return {
      displayName,
      awardCategory,
      activities
    }
  } catch (error) {
    console.error('Error fetching MVP profile:', error)
    return null
  }
}

function extractMVPProfileUrl(text: string | null): string | null {
  if (!text) return null
  
  const mvpUrlMatch = text.match(/https?:\/\/mvp\.microsoft\.com\/[^\s<>]+/i)
  return mvpUrlMatch ? mvpUrlMatch[0] : null
}

function isGitHubUrlMatch(url: string, githubUsername: string): boolean {
  const normalizedUsername = githubUsername.toLowerCase()
  const normalizedUrl = url.toLowerCase()
  
  return normalizedUrl.includes(`github.com/${normalizedUsername}`)
}

export async function verifyMVPAccess(githubUsername: string): Promise<MVPVerificationResult> {
  try {
    const githubBio = await fetchGitHubProfile(githubUsername)
    const mvpProfileUrl = extractMVPProfileUrl(githubBio)
    
    if (!mvpProfileUrl) {
      return {
        isVerified: false,
        error: 'No Microsoft MVP profile URL found in your GitHub bio. Please add your MVP profile URL to your GitHub bio.'
      }
    }
    
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
    
    if (!mvpProfile) {
      return {
        isVerified: false,
        error: 'Unable to access your MVP profile. Please ensure your MVP profile is publicly accessible.'
      }
    }
    
    if (mvpProfile.awardCategory !== 'Security') {
      return {
        isVerified: false,
        error: `Your MVP Award Category is "${mvpProfile.awardCategory}". This app requires Security MVP status.`
      }
    }
    
    const hasMatchingGitHub = mvpProfile.activities.some(activity => 
      isGitHubUrlMatch(activity, githubUsername)
    )
    
    if (!hasMatchingGitHub) {
      return {
        isVerified: false,
        error: 'Your GitHub profile URL was not found in your MVP profile activities. Please add your GitHub profile URL to your MVP profile.'
      }
    }
    
    return {
      isVerified: true
    }
  } catch (error) {
    console.error('Error during MVP verification:', error)
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.'
    }
  }
}
