export interface MVPProfile {
  profileUrl: string
}
async function fetchGi
}

async function fetchGitHubBio(username: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) return null

    const data = await response.json()

  } catch (error) {
    console.error('Error fetching GitHub profile:', error)
    return null
   
}

async function fetchMVPProfile(mvpProfileUrl: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(mvpProfileUrl)
    
    
    const html = await response.text()
expo
    const displayNameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'MVP'
    
    const activityMatches = html.matchAll(/href="(https?:\/\/github\.com\/[^"]+)"/gi)
    const activities = Array.from(activityMatches)
      .map(match => match[1])
    if (!bio) {
    
      }

    
      return {
     
    }
    const mvpProfileUrl = mvpUrlMatch[0]

   
 

    const hasGitHubLink = isGitHubUrlMatch(mvpProfile.activities, githubUsername)
    if (!hasGitHubLink) {
  
      }

      isVerified: true,
      displayName: mvpProfile.displayName
  } 
 

  }








    if (!bio) {
      return {
        isVerified: false,
        error: 'Could not fetch your GitHub profile. Please ensure your profile is public.'
      }
    }

    const mvpUrlMatch = bio.match(/https?:\/\/mvp\.microsoft\.com\/[^\s)]+/i)
    
    if (!mvpUrlMatch) {
      return {
        isVerified: false,
        error: 'No Microsoft MVP profile URL found in your GitHub bio.'
      }
    }

    const mvpProfileUrl = mvpUrlMatch[0]
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)

    if (!mvpProfile) {
      return {
        isVerified: false,
        error: 'Could not access your MVP profile. Please ensure the URL in your GitHub bio is correct.'
      }
    }

    const hasGitHubLink = isGitHubUrlMatch(mvpProfile.activities, githubUsername)

    if (!hasGitHubLink) {
      return {
        isVerified: false,
        error: 'Your MVP profile does not contain a link back to your GitHub profile. Please add your GitHub URL to your MVP profile activities or social links.'
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
