import { useState, useEffect } from 'react'
import { verifyMVPAccess, VerificationChecks, VerificationStep } from '@/lib/mvpAuth'
import { Shield, CheckCircle, XCircle, Link as LinkIcon, Clock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AccessVerificationProps {
  username: string
  onVerified: () => void
}

export function AccessVerification({ username, onVerified }: AccessVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(true)
  const [currentStep, setCurrentStep] = useState<VerificationStep>('fetching-github')
  const [currentMessage, setCurrentMessage] = useState('Starting verification...')
  const [progress, setProgress] = useState(0)
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    mvpProfileUrl?: string
    displayName?: string
    error?: string
    detectedMVPUrl?: string
    detectedGitHubLinks?: string[]
    checks?: VerificationChecks
  } | null>(null)

  useEffect(() => {
    let mounted = true
    
    const verify = async () => {
      const result = await verifyMVPAccess(username, (step, message) => {
        if (!mounted) return
        setCurrentStep(step)
        setCurrentMessage(message)
        
        const stepProgress = {
          'fetching-github': 20,
          'extracting-mvp-url': 35,
          'fetching-mvp-profile': 50,
          'validating-category': 75,
          'checking-github-link': 90,
          'complete': 100
        }
        setProgress(stepProgress[step] || 0)
      })
      
      if (!mounted) return
      
      setVerificationResult(result)
      setIsVerifying(false)
      
      if (result.isVerified) {
        setTimeout(() => {
          if (mounted) {
            onVerified()
          }
        }, 2000)
      }
    }
    
    verify()
    
    return () => {
      mounted = false
    }
  }, [username, onVerified])

  if (isVerifying) {
    const stepDetails = {
      'fetching-github': {
        icon: '🔍',
        title: 'Fetching GitHub Profile',
        description: `Loading profile data for @${username}`
      },
      'extracting-mvp-url': {
        icon: '🔗',
        title: 'Looking for MVP Profile',
        description: 'Searching for Microsoft MVP profile URL'
      },
      'fetching-mvp-profile': {
        icon: '✨',
        title: 'Reading MVP Profile',
        description: 'Fetching your MVP profile page'
      },
      'validating-category': {
        icon: '🛡️',
        title: 'Checking Award Category',
        description: 'Verifying Security MVP status'
      },
      'checking-github-link': {
        icon: '✅',
        title: 'Validating Cross-Links',
        description: 'Ensuring GitHub profile is linked on MVP profile'
      },
      'complete': {
        icon: '🎉',
        title: 'Complete',
        description: 'Verification finished'
      }
    }

    const currentStepDetail = stepDetails[currentStep]

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="fixed inset-0 -z-10 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield size={48} className="text-primary animate-pulse" weight="bold" />
            </div>
            <CardTitle>Verifying MVP Access</CardTitle>
            <CardDescription>Checking your Microsoft Security MVP credentials...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0 animate-bounce">
                  {currentStepDetail.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {currentStepDetail.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentMessage}
                  </p>
                  {currentStep === 'fetching-mvp-profile' && (
                    <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      <Clock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" weight="bold" />
                      <p className="text-xs text-blue-800">
                        <strong>Please wait:</strong> {currentStepDetail.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${progress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 20 ? 'text-foreground font-medium' : ''}>GitHub profile lookup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${progress >= 35 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 35 ? 'text-foreground font-medium' : ''}>MVP URL extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${progress >= 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 50 ? 'text-foreground font-medium' : ''}>MVP profile fetch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${progress >= 75 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 75 ? 'text-foreground font-medium' : ''}>Security category check</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${progress >= 90 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={progress >= 90 ? 'text-foreground font-medium' : ''}>Bidirectional link validation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verificationResult?.isVerified) {
    const checks = verificationResult?.checks
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div 
          className="fixed inset-0 -z-10 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle size={48} className="text-destructive" weight="bold" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be a Microsoft Security MVP to access ConTrails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {checks && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Verification Status:</h3>
                
                <div className="space-y-3">
                  <div className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${checks.hasMVPUrlOnGitHub ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {checks.hasMVPUrlOnGitHub ? (
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="bold" />
                    ) : (
                      <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="bold" />
                    )}
                    <div>
                      <p className={`font-medium ${checks.hasMVPUrlOnGitHub ? 'text-green-900' : 'text-red-900'}`}>
                        {checks.hasMVPUrlOnGitHub ? '✓ MVP profile URL found on GitHub' : '✗ MVP profile URL not found on GitHub'}
                      </p>
                      {!checks.hasMVPUrlOnGitHub && (
                        <p className="text-red-700 mt-1 text-xs">
                          Add your Microsoft MVP profile URL to your GitHub profile page (bio, README, or social links)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${checks.hasValidMVPProfile ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {checks.hasValidMVPProfile ? (
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="bold" />
                    ) : (
                      <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="bold" />
                    )}
                    <div>
                      <p className={`font-medium ${checks.hasValidMVPProfile ? 'text-green-900' : 'text-red-900'}`}>
                        {checks.hasValidMVPProfile ? '✓ MVP profile is accessible' : '✗ MVP profile could not be accessed'}
                      </p>
                      {!checks.hasValidMVPProfile && checks.hasMVPUrlOnGitHub && (
                        <p className="text-red-700 mt-1 text-xs">
                          The MVP profile URL found may be invalid or inaccessible
                        </p>
                      )}
                    </div>
                  </div>

                  {checks.hasValidMVPProfile && (
                    <div className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${checks.isSecurityMVP ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      {checks.isSecurityMVP ? (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="bold" />
                      ) : (
                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="bold" />
                      )}
                      <div>
                        <p className={`font-medium ${checks.isSecurityMVP ? 'text-green-900' : 'text-red-900'}`}>
                          {checks.isSecurityMVP ? '✓ Award Category is Security' : '✗ Award Category is not Security'}
                        </p>
                        {!checks.isSecurityMVP && (
                          <p className="text-red-700 mt-1 text-xs">
                            ConTrails is only available to Security MVPs
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {checks.hasValidMVPProfile && (
                    <div className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${checks.hasGitHubOnMVPProfile ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      {checks.hasGitHubOnMVPProfile ? (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="bold" />
                      ) : (
                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="bold" />
                      )}
                      <div>
                        <p className={`font-medium ${checks.hasGitHubOnMVPProfile ? 'text-green-900' : 'text-red-900'}`}>
                          {checks.hasGitHubOnMVPProfile ? '✓ GitHub profile found on MVP profile' : '✗ GitHub profile not found on MVP profile'}
                        </p>
                        {!checks.hasGitHubOnMVPProfile && (
                          <p className="text-red-700 mt-1 text-xs">
                            Add https://github.com/{username} to your MVP profile activities or social links
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(verificationResult?.detectedMVPUrl || verificationResult?.detectedGitHubLinks) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Detected Profile Information:</h3>
                
                {verificationResult?.detectedMVPUrl && (
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <div className="flex items-start gap-3 text-sm">
                      <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">Your MVP Profile</p>
                        <a 
                          href={verificationResult.detectedMVPUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline break-all"
                        >
                          {verificationResult.detectedMVPUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {verificationResult?.detectedGitHubLinks && verificationResult.detectedGitHubLinks.length > 0 && (
                  <div className="bg-muted/50 border rounded-lg p-4">
                    <div className="flex items-start gap-3 text-sm">
                      <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">GitHub Links Found on Your MVP Profile</p>
                        <ul className="space-y-1">
                          {verificationResult.detectedGitHubLinks.map((link, index) => (
                            <li key={index}>
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline break-all"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Quick Links:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <p className="font-medium mb-1">Your GitHub Profile</p>
                    <a 
                      href={`https://github.com/${username}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      https://github.com/{username}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <p className="font-medium mb-1">Microsoft MVP Portal</p>
                    <a 
                      href="https://mvp.microsoft.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      https://mvp.microsoft.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                After updating both profiles, refresh this page to verify your access
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => window.location.reload()}>
                  Retry Verification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div 
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, oklch(0.70 0.15 200 / 0.05) 2px, oklch(0.70 0.15 200 / 0.05) 4px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-green-500" weight="bold" />
          </div>
          <CardTitle>Access Granted</CardTitle>
          <CardDescription>
            Welcome, {verificationResult.displayName}!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Your Microsoft Security MVP credentials have been verified
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="text-green-700">Loading ConTrails...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
