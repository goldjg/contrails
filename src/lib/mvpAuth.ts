export interface MVPProfile {
  displayName: strin
}
export async function 
 

    return data.bio || ''
    con
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) return null

    const data = await response.json()
    return data.bio || ''
    if (!response.o
    console.error('Error fetching GitHub profile:', error)
    
   
 

    
      profileUrl: mvpProfileUrl,
      activities
 

}
export 
  
    const urlLower = url.toLowerC

}
expo
  displayName?: string
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












































