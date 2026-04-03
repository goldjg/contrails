export interface MVPProfile {
  displayName: string
  activities: string[]
  awardCategory: string
}

async function fetchGitHubBio(username: string): Promise<string | null> {
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

async function fetchMVPProfile(mvpProfileUrl: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(mvpProfileUrl)
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

function isGitHubUrlMatch(activities: string[], githubUsername: string): boolean {
  const normalizedUsername = githubUsername.toLowerCase()
  return activities.some(activity => {
    const url = activity.toLowerCase()
    return url.includes(`github.com/${normalizedUsername}`) ||
           url.includes(`github.com/${normalizedUsername}/`)
  })
}

function isSecurityCategory(awardCategory: string): boolean {
  return awardCategory.toLowerCase().includes('security')
}

export async function verifyMVPAccess(githubUsername: string): Promise<{
  isVerified: boolean
  mvpProfileUrl?: string
  displayName?: string
  error?: string
}> {
  try {
    const bio = await fetchGitHubBio(githubUsername)

    if (!bio) {
      return {
        isVerified: false,
        error: 'Could not fetch your GitHub profile or your bio is empty. Please ensure your profile is public and contains your MVP profile URL.'
      }
    }

    const mvpUrlMatch = bio.match(/https?:\/\/mvp\.microsoft\.com\/[^\s)]+/i)
    
    if (!mvpUrlMatch) {
      return {
        isVerified: false,
        error: 'No Microsoft MVP profile URL found in your GitHub bio. Please add your MVP profile URL to your GitHub bio.'
      }
    }

    const mvpProfileUrl = mvpUrlMatch[0]
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)

    if (!mvpProfile) {
      return {
        isVerified: false,
        error: 'Could not access your MVP profile. Please ensure the URL in your GitHub bio is correct and publicly accessible.'
      }
    }

    if (!isSecurityCategory(mvpProfile.awardCategory)) {
      return {
        isVerified: false,
        error: `Your MVP Award Category is "${mvpProfile.awardCategory}". Only Security MVPs can access ConTrails.`
      }
    }

    const hasGitHubLink = isGitHubUrlMatch(mvpProfile.activities, githubUsername)

    if (!hasGitHubLink) {
      return {
        isVerified: false,
        error: 'Your MVP profile does not contain a link back to your GitHub profile. Please add your GitHub URL (https://github.com/' + githubUsername + ') to your MVP profile activities or social links.'
      }
    }

    return {
      isVerified: true,
      mvpProfileUrl,
      displayName: mvpProfile.displayName
    }
  } catch (error) {
    console.error('Error during MVP verification:', error)
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again later.'
    }
  }
}
