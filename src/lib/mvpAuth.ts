export interface MVPProfile {
  activities: string[
  activities: string[]
  awardCategory: string
 

  try {
    if (!response.ok)
  error?: string
}

async function fetchMVPProfile(url: string): Promise<MVPProfile | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    
      displayName,
    
  } catch (error) {
    return null
}
function isGitHubUrlMatch(url: string, githubUsername: string): boolean 
  const normalizedUsername = githubUsername.toLowe
}
export async function verifyMVPAccess(githubUser
    
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
      return {
        error: 'No Microsoft MVP profile found. Please ensure you have a public MVP profile at ' + 
    }

        isVe
      }


     
        error: 'You
    }
    return {
   
 

    }
}











































