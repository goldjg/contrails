export interface MVPProfile {
  profileUrl: string
  displayName: string
  activities: string[]
}

export async function fetchGitHubProfile(username: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) return null

    const data = await response.json()
    return data.bio || ''
  } catch (error) {
    console.error('Error fetching GitHub profile:', error)
    return null
  }
}

export function extractMVPProfileUrl(bio: string): string | null {
  const mvpUrlMatch = bio.match(/https?:\/\/mvp\.microsoft\.com\/[^\s]+/i)
  return mvpUrlMatch ? mvpUrlMatch[0] : null
}

export async function fetchMVPProfile(mvpProfileUrl: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(mvpProfileUrl)
    if (!response.ok) return null

    const html = await response.text()
    
    const displayNameMatch = html.match(/<h1[^>]*class="[^"]*c-heading-3[^"]*"[^>]*>(.*?)<\/h1>/i)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'MVP'
    
    const activityMatches = html.matchAll(/href="(https?:\/\/github\.com\/[^"]+)"/gi)
    const activities = Array.from(activityMatches)
      .map(match => match[1])
      .filter(url => url.includes('github.com'))
    
    return {
      profileUrl: mvpProfileUrl,
      displayName,
      activities
    }
  } catch (error) {
    console.error('Error fetching MVP profile:', error)
    return null
  }
}

export function isGitHubUrlMatch(mvpGitHubUrls: string[], userGitHubUsername: string): boolean {
  const normalizedUsername = userGitHubUsername.toLowerCase()
  
  return mvpGitHubUrls.some(url => {
    const urlLower = url.toLowerCase()
    return urlLower.includes(`github.com/${normalizedUsername}`) || 
           urlLower.includes(`github.com/${normalizedUsername}/`)
  })
}

export async function verifyMVPAccess(githubUsername: string): Promise<{
  isVerified: boolean
  displayName?: string
  error?: string
}> {
  const githubBio = await fetchGitHubProfile(githubUsername)
  
  if (!githubBio) {
    return {
      isVerified: false,
      error: 'Could not fetch GitHub profile'
    }
  }

  const mvpProfileUrl = extractMVPProfileUrl(githubBio)

  if (!mvpProfileUrl) {
    return {
      isVerified: false,
      error: 'No MVP profile URL found in GitHub bio'
    }
  }

  const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
  
  if (!mvpProfile) {
    return {
      isVerified: false,
      error: 'Could not fetch MVP profile'
    }
  }

  const hasGitHubLink = isGitHubUrlMatch(mvpProfile.activities, githubUsername)

  if (!hasGitHubLink) {
    return {
      isVerified: false,
      error: 'GitHub profile not found in MVP profile activities'
    }
  }
  
  return {
    isVerified: true,
    displayName: mvpProfile.displayName
  }
}
