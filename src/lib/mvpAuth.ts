export interface MVPProfile {
  activities: string[
  activities: string[]
  awardCategory: string
 

    return data.bio || null
    con
  }

  tr
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
func
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
    i

    const mvpProfile = await fetchMVPProfile(mvpProfile
    if (!mvpPro
   
 

      return {
        error: `Your MVP Award Category is "${mvpProfile.
  
    const hasGitHubLink = isGitHubUrlM
    if (!hasGitHubLink) {
        isVerified: false,
      }

 

  } catch (error) {
    return {
 













































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

