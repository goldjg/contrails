import { useState, useEffect } from 'react'
import { verifyMVPAccess } from '@/lib/mvpAuth'
import { Shield, CheckCircle, XCircle, Link as LinkIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AccessVerificationProps {
  username: string
  onVerified: () => void
}

export function AccessVerification({ username, onVerified }: AccessVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    mvpProfileUrl?: string
    displayName?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    const verify = async () => {
      setIsVerifying(true)
      const result = await verifyMVPAccess(username)
      setVerificationResult(result)
      setIsVerifying(false)
      
      if (result.isVerified) {
        setTimeout(() => {
          onVerified()
        }, 2000)
      }
    }
    
    verify()
  }, [username, onVerified])

  if (isVerifying) {
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
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
                <p>Fetching GitHub profile for <span className="font-mono text-foreground">@{username}</span></p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
                <p>Looking for MVP profile URL in bio</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
                <p>Verifying bidirectional profile links</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verificationResult?.isVerified) {
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
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">
                {verificationResult?.error}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">To gain access, you need:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Shield size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <p className="font-medium mb-1">Be a Microsoft Security MVP</p>
                    <p className="text-muted-foreground">
                      Your Award Category on your MVP profile must be "Security"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <p className="font-medium mb-1">Add your MVP profile URL to your GitHub bio</p>
                    <p className="text-muted-foreground">
                      Go to your <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub profile</a> and add your Microsoft MVP profile URL (e.g., https://mvp.microsoft.com/en-US/mvp/profile/YOUR-ID) to your bio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <LinkIcon size={20} className="text-primary flex-shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <p className="font-medium mb-1">Add your GitHub profile to your MVP profile</p>
                    <p className="text-muted-foreground">
                      Ensure your <a href="https://mvp.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft MVP profile</a> lists your GitHub profile URL (https://github.com/{username}) in your activities or social links
                    </p>
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
