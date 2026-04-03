export interface MVPProfile {
  displayName: string
  activities: string[]
  awardCategory: string
}

export interface VerificationResult {
  isVerified: boolean
  error?: string
}

async function fetchMVPProfile(url: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    
    const html = await response.text()
    
    const displayNameMatch = html.match(/<h1[^>]*class="[^"]*c-subheading[^"]*"[^>]*>([^<]+)<\/h1>/i)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'MVP'
    
    const activityMatches = html.matchAll(/href="(https?:\/\/[^"]+)"/gi)
    const activities = Array.from(activityMatches)
      .map(match => match[1])
      .filter(url => url.includes('github.com'))
    
    const awardCategoryMatch = html.match(/Award Category[^<]*<[^>]*>([^<]+)</i) ||
                              html.match(/category[^>]*>([^<]*Security[^<]*)</i) ||
                              html.match(/<dt[^>]*>Award Category<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i)
    const awardCategory = awardCategoryMatch ? awardCategoryMatch[1].trim() : ''

    return {
      displayName,
      activities,
      awardCategory
    }
  } catch (error) {
    console.error('Error fetching MVP profile:', error)
    return null
  }
}

function isGitHubUrlMatch(url: string, githubUsername: string): boolean {
  const normalizedUrl = url.toLowerCase()
  const normalizedUsername = githubUsername.toLowerCase()
  return normalizedUrl.includes(`github.com/${normalizedUsername}`)
}

export async function verifyMVPAccess(githubUsername: string): Promise<VerificationResult> {
  try {
    const mvpProfileUrl = `https://mvp.microsoft.com/en-us/PublicProfile/${githubUsername}`
    
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
    if (!mvpProfile) {
      return {
        isVerified: false,
        error: 'No Microsoft MVP profile found. Please ensure you have a public MVP profile at ' + mvpProfileUrl
      }
    }

    if (!mvpProfile.awardCategory.toLowerCase().includes('security')) {
      return {
        isVerified: false,
        error: `Your MVP Award Category is "${mvpProfile.awardCategory}". This app is restricted to Security MVPs only.`
      }
    }

    const hasGitHubLink = mvpProfile.activities.some(url => isGitHubUrlMatch(url, githubUsername))

    if (!hasGitHubLink) {
      return {
        isVerified: false,
        error: 'Your GitHub username was not found in your MVP profile activities. Please add your GitHub profile to your MVP activities.'
      }
    }

    return {
      isVerified: true
    }
  } catch (error) {
    console.error('Error verifying MVP access:', error)
    return {
      isVerified: false,
      error: 'An error occurred while verifying your MVP status. Please try again later.'
    }
  }
}
