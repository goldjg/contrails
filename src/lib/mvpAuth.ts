export interface MVPProfile {
  activities: string[
}
async function fetchGit
}

async function fetchGitHubBio(username: string): Promise<string | null> {
  } cat
  }


    if (!response.ok) return null
    const html = await resp
    const displayNa
    
    const activ
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
export async functi
    }
  displayName?: str
    console.error('Error fetching MVP profile:', error)
    return null
  }
 

function isGitHubUrlMatch(activities: string[], githubUsername: string): boolean {
  const normalizedUsername = githubUsername.toLowerCase()

    const url = activity.toLowerCase()
    if (!mvpUrlMatch) {
           url.includes(`github.com/${normalizedUsername}/`)
    
}

function isSecurityCategory(awardCategory: string): boolean {
  return awardCategory.toLowerCase().includes('security')
}

export async function verifyMVPAccess(githubUsername: string): Promise<{
    }
  mvpProfileUrl?: string
  displayName?: string
  error?: string
    
  try {
    const hasGitHubLink = isGitHubUrlMatch(mvpProfil

      return {
      return {
      }
        error: 'Could not fetch your GitHub profile or your bio is empty. Please ensure your profile is public and contains your MVP profile URL.'
      }
    }

    const mvpUrlMatch = bio.match(/https?:\/\/mvp\.microsoft\.com\/[^\s)]+/i)
    
    if (!mvpUrlMatch) {
      error: '
        isVerified: false,
        error: 'No Microsoft MVP profile URL found in your GitHub bio. Please add your MVP profile URL to your GitHub bio.'
      }


    const mvpProfileUrl = mvpUrlMatch[0]
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)

    if (!mvpProfile) {


        error: 'Could not access your MVP profile. Please ensure the URL in your GitHub bio is correct and publicly accessible.'

    }

    if (!isSecurityCategory(mvpProfile.awardCategory)) {

        isVerified: false,
        error: `Your MVP Award Category is "${mvpProfile.awardCategory}". Only Security MVPs can access ConTrails.`
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

