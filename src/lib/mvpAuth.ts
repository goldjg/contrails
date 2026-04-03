export interface MVPProfile {
  activities: string[
  activities: string[]
  awardCategory: string
 


  try {
    if (!respons
    const html = await r
    const displayNameM
 

      .filter(url => url.includes('github.com'))
    con
                              html.match(/<dt[^
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
    const mvpProfil
    }
  } catch (error) {
    console.error('Error fetching MVP profile:', error)
    }
  }
 

function isGitHubUrlMatch(url: string, githubUsername: string): boolean {
  const normalizedUrl = url.toLowerCase()
    const hasGitHubLink = mvpProfile.activities.some(url 
  return normalizedUrl.includes(`github.com/${normalizedUsername}`)
 

export async function verifyMVPAccess(githubUsername: string): Promise<VerificationResult> {
  try {
    const mvpProfileUrl = `https://mvp.microsoft.com/en-us/PublicProfile/${githubUsername}`
    
    const mvpProfile = await fetchMVPProfile(mvpProfileUrl)
    if (!mvpProfile) {
    return {
        isVerified: false,
        error: 'No Microsoft MVP profile found. Please ensure you have a public MVP profile at ' + mvpProfileUrl
      }



      return {
        isVerified: false,
        error: `Your MVP Award Category is "${mvpProfile.awardCategory}". This app is restricted to Security MVPs only.`

    }

    const hasGitHubLink = mvpProfile.activities.some(url => isGitHubUrlMatch(url, githubUsername))




















