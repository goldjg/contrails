export interface MVPProfile {
  displayName: string
  awardCategory: string
  activities: string[]
}

export interface VerificationChecks {
  hasMVPUrlOnGitHub: boolean
  hasValidMVPProfile: boolean
  isSecurityMVP: boolean
  hasGitHubOnMVPProfile: boolean
}

export interface MVPVerificationResult {
  isVerified: boolean
  profile?: MVPProfile
  error?: string
  detectedMVPUrl?: string
  detectedGitHubLinks?: string[]
  checks?: VerificationChecks
  displayName?: string
}

interface GitHubUser {
  bio: string | null
  blog: string | null
  twitter_username: string | null
  company: string | null
  location: string | null
  name: string | null
  login: string
  html_url: string
  social_accounts?: Array<{ provider: string; url: string }>
}

async function fetchGitHubProfile(username: string): Promise<GitHubUser> {
  console.log(`[MVP Auth] Fetching GitHub user data for: ${username}`)
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    console.log(`[MVP Auth] GitHub API response status: ${response.status}`)
    
    if (!response.ok) {
      console.error(`[MVP Auth] GitHub API request failed with status ${response.status}`)
      throw new Error(`GitHub API request failed with status ${response.status}`)
    }
    
    const userData: GitHubUser = await response.json()
    console.log(`[MVP Auth] GitHub user data retrieved:`, {
      bio: userData.bio?.substring(0, 100),
      blog: userData.blog,
      socialAccounts: userData.social_accounts?.length || 0
    })
    
    return userData
  } catch (error) {
    console.error(`[MVP Auth] Error fetching GitHub profile:`, error)
    throw error
  }
}

function extractMVPProfileUrl(userData: GitHubUser): string | null {
  console.log(`[MVP Auth] Searching for MVP profile URL in GitHub user data`)
  
  const textsToSearch: string[] = []
  
  if (userData.bio) textsToSearch.push(userData.bio)
  if (userData.blog) textsToSearch.push(userData.blog)
  if (userData.company) textsToSearch.push(userData.company)
  if (userData.location) textsToSearch.push(userData.location)
  if (userData.social_accounts) {
    userData.social_accounts.forEach(account => textsToSearch.push(account.url))
  }
  
  for (const text of textsToSearch) {
    const mvpUrlMatch = text.match(/https?:\/\/mvp\.microsoft\.com\/[^\s"'<>]+/)
    if (mvpUrlMatch) {
      console.log(`[MVP Auth] Found MVP profile URL: ${mvpUrlMatch[0]}`)
      return mvpUrlMatch[0]
    }
  }
  
  console.log(`[MVP Auth] No MVP profile URL found in GitHub user data`)
  console.log(`[MVP Auth] Searched in:`, textsToSearch)
  
  return null
}

async function fetchMVPProfileViaProxy(mvpProfileUrl: string, githubUsername: string): Promise<{
  isValid: boolean
  isSecurityMVP: boolean
  hasGitHubLink: boolean
  displayName?: string
  awardCategory?: string
  detectedGitHubLinks?: string[]
}> {
  console.log(`[MVP Auth] Fetching MVP profile via LLM proxy: ${mvpProfileUrl}`)
  
  try {
    const promptText = `You are a web scraping assistant. Your task is to fetch the content from this Microsoft MVP profile page: ${mvpProfileUrl}

Extract the following information and return it in JSON format:

1. The MVP's display name (usually shown as the person's full name prominently at the top)
2. The "Award Category" field value (look for text like "Security", "Azure", "Developer Technologies", "Microsoft 365", etc.)
3. All URLs containing "github.com" anywhere on the page (check activities section, social links, bio, etc.)

Important notes:
- The Award Category is typically shown as a label or heading on the profile
- GitHub links may appear in various formats: github.com/username, full profile URLs, or in activity descriptions
- We're looking for the GitHub username "${githubUsername}" specifically - check if any GitHub URL contains this username

Return ONLY a valid JSON object with this exact structure (no additional text):
{
  "displayName": "Full name from the profile",
  "awardCategory": "The award category text (e.g., Security)",
  "githubLinks": ["list", "of", "github.com", "urls", "found"],
  "error": ""
}

If you cannot access the URL or encounter errors, return:
{
  "error": "Description of the error",
  "displayName": "",
  "awardCategory": "",
  "githubLinks": []
}`
    
    console.log(`[MVP Auth] Sending request to LLM proxy...`)
    const response = await window.spark.llm(promptText, "gpt-4o", true)
    console.log(`[MVP Auth] LLM proxy response received:`, response)
    
    // Strip markdown code fences that LLMs commonly wrap around JSON responses
    const cleanedResponse = response.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    
    const parsedResponse = JSON.parse(cleanedResponse)
    
    // Check for meaningful error content - LLMs sometimes return "None", "No error", "N/A" etc.
    // instead of an empty string, so a simple truthy check causes false negatives
    const errorText = typeof parsedResponse.error === 'string' ? parsedResponse.error.trim() : ''
    const hasError = errorText !== '' &&
      !/^(none|no error|no errors|n\/a|null|false|no|0)$/i.test(errorText)
    
    if (hasError) {
      console.log(`[MVP Auth] LLM proxy returned error:`, parsedResponse.error)
      return {
        isValid: false,
        isSecurityMVP: false,
        hasGitHubLink: false
      }
    }
    
    const displayName = parsedResponse.displayName || ''
    const awardCategory = parsedResponse.awardCategory || ''
    const githubLinks = parsedResponse.githubLinks || []
    
    const isSecurityMVP = awardCategory.toLowerCase().includes('security')
    const expectedGitHubUrl = `https://github.com/${githubUsername}`
    const hasGitHubLink = githubLinks.some((link: string) => 
      link.toLowerCase().includes(githubUsername.toLowerCase())
    )
    
    console.log(`[MVP Auth] Parsed MVP profile:`, {
      displayName,
      awardCategory,
      isSecurityMVP,
      hasGitHubLink,
      githubLinksFound: githubLinks.length
    })
    
    return {
      isValid: true,
      isSecurityMVP,
      hasGitHubLink,
      displayName,
      awardCategory,
      detectedGitHubLinks: githubLinks
    }
  } catch (error) {
    console.error(`[MVP Auth] Error fetching MVP profile via proxy:`, error)
    return {
      isValid: false,
      isSecurityMVP: false,
      hasGitHubLink: false
    }
  }
}

export async function verifyMVPAccess(githubUsername: string): Promise<MVPVerificationResult> {
  console.log(`[MVP Auth] ========== Starting verification for user: ${githubUsername} ==========`)
  
  const checks: VerificationChecks = {
    hasMVPUrlOnGitHub: false,
    hasValidMVPProfile: false,
    isSecurityMVP: false,
    hasGitHubOnMVPProfile: false
  }
  
  let detectedMVPUrl: string | undefined
  let detectedGitHubLinks: string[] | undefined
  
  try {
    console.log(`[MVP Auth] Step 1: Fetching GitHub user data...`)
    let githubUserData: GitHubUser
    try {
      githubUserData = await fetchGitHubProfile(githubUsername)
    } catch (error) {
      console.error(`[MVP Auth] FATAL: Cannot fetch GitHub user data`)
      return {
        isVerified: false,
        error: 'Unable to fetch GitHub profile data. Please try again later.',
        checks
      }
    }
    
    console.log(`[MVP Auth] Step 2: Extracting MVP profile URL from GitHub profile...`)
    const mvpProfileUrl = extractMVPProfileUrl(githubUserData)
    if (mvpProfileUrl) {
      checks.hasMVPUrlOnGitHub = true
      detectedMVPUrl = mvpProfileUrl
      console.log(`[MVP Auth] ✓ Check 1 PASSED: MVP URL found on GitHub profile`)
      
      console.log(`[MVP Auth] Step 3: Fetching MVP profile via LLM proxy...`)
      const mvpData = await fetchMVPProfileViaProxy(mvpProfileUrl, githubUsername)
      
      if (mvpData.isValid) {
        checks.hasValidMVPProfile = true
        console.log(`[MVP Auth] ✓ Check 2 PASSED: MVP profile is valid and accessible`)
        
        if (mvpData.isSecurityMVP) {
          checks.isSecurityMVP = true
          console.log(`[MVP Auth] ✓ Check 3 PASSED: Award Category is Security`)
        } else {
          console.log(`[MVP Auth] ✗ Check 3 FAILED: Award Category is "${mvpData.awardCategory}", not Security`)
        }
        
        if (mvpData.hasGitHubLink) {
          checks.hasGitHubOnMVPProfile = true
          detectedGitHubLinks = mvpData.detectedGitHubLinks
          console.log(`[MVP Auth] ✓ Check 4 PASSED: GitHub profile link found on MVP profile`)
        } else {
          console.log(`[MVP Auth] ✗ Check 4 FAILED: GitHub profile link not found on MVP profile`)
          if (mvpData.detectedGitHubLinks && mvpData.detectedGitHubLinks.length > 0) {
            console.log(`[MVP Auth] GitHub links found (but not matching):`, mvpData.detectedGitHubLinks)
            detectedGitHubLinks = mvpData.detectedGitHubLinks
          }
        }
        
        const allChecksPassed = checks.hasMVPUrlOnGitHub && 
                               checks.hasValidMVPProfile && 
                               checks.isSecurityMVP && 
                               checks.hasGitHubOnMVPProfile
        
        console.log(`[MVP Auth] ========== Verification Summary ==========`)
        console.log(`[MVP Auth] MVP URL on GitHub: ${checks.hasMVPUrlOnGitHub ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] MVP Profile Valid: ${checks.hasValidMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] Security MVP: ${checks.isSecurityMVP ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] GitHub on MVP: ${checks.hasGitHubOnMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
        console.log(`[MVP Auth] FINAL RESULT: ${allChecksPassed ? '✓ VERIFIED' : '✗ NOT VERIFIED'}`)
        console.log(`[MVP Auth] ===========================================`)
        
        if (allChecksPassed) {
          return {
            isVerified: true,
            detectedMVPUrl,
            detectedGitHubLinks,
            displayName: mvpData.displayName,
            checks,
            profile: {
              displayName: mvpData.displayName || githubUserData.name || githubUsername,
              awardCategory: mvpData.awardCategory || 'Security',
              activities: []
            }
          }
        } else {
          return {
            isVerified: false,
            error: 'Verification incomplete. Please check all requirements.',
            detectedMVPUrl,
            detectedGitHubLinks,
            checks
          }
        }
      } else {
        console.log(`[MVP Auth] ✗ Check 2 FAILED: MVP profile could not be verified`)
      }
    } else {
      console.log(`[MVP Auth] ✗ Check 1 FAILED: No MVP URL found on GitHub profile`)
    }
    
    console.log(`[MVP Auth] ========== Verification Summary ==========`)
    console.log(`[MVP Auth] MVP URL on GitHub: ${checks.hasMVPUrlOnGitHub ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] MVP Profile Valid: ${checks.hasValidMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] Security MVP: ${checks.isSecurityMVP ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] GitHub on MVP: ${checks.hasGitHubOnMVPProfile ? '✓ PASS' : '✗ FAIL'}`)
    console.log(`[MVP Auth] FINAL RESULT: ✗ NOT VERIFIED`)
    console.log(`[MVP Auth] ===========================================`)
    
    return {
      isVerified: false,
      error: 'Verification failed. Please ensure all requirements are met.',
      detectedMVPUrl,
      detectedGitHubLinks,
      checks
    }
  } catch (error) {
    console.error(`[MVP Auth] ✗ UNEXPECTED ERROR during verification:`, error)
    return {
      isVerified: false,
      error: 'An unexpected error occurred during verification. Please try again.',
      checks
    }
  }
}
