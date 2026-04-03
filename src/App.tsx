import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { ConferencesView } from '@/components/ConferencesView'
import { AnalyticsView } from '@/components/AnalyticsView'
import { MVPsView } from '@/components/MVPsView'
import { MVPProfile } from '@/components/MVPProfile'
import { MapView } from '@/components/MapView'
import { Conference, Attendance } from '@/lib/types'
import { Globe, ChartBar, Users, MapTrifold, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { seedConferences2026 } from '@/lib/seedData'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'conferences' | 'analytics' | 'mvps' | 'map'

function App() {
  const [conferences, setConferences] = useKV<Conference[]>('conferences', [])
  const [attendances, setAttendances] = useKV<Attendance[]>('attendances', [])
  const [currentUser, setCurrentUser] = useState<{ login: string; avatarUrl: string; isOwner: boolean } | null>(null)
  const [hasSeeded, setHasSeeded] = useState(false)
  const [selectedMVP, setSelectedMVP] = useState<{ userId: string; userName: string; userAvatar: string } | null>(null)
  const [currentView, setCurrentView] = useState<ViewMode>('conferences')
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      const user = await spark.user()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (currentUser?.isOwner && conferences && conferences.length === 0 && !hasSeeded) {
      setConferences(seedConferences2026)
      setHasSeeded(true)
      toast.success('Loaded 24 conferences for 2026!')
    }
  }, [currentUser, conferences, hasSeeded, setConferences])

  useEffect(() => {
    const checkScroll = () => {
      if (navRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navRef.current
        const hasOverflow = scrollWidth > clientWidth
        const canScrollLeft = scrollLeft > 0
        const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1
        
        setShowLeftFade(canScrollLeft)
        setShowRightFade(canScrollRight)
        setShowLeftArrow(hasOverflow && canScrollLeft)
        setShowRightArrow(hasOverflow && canScrollRight)
      }
    }

    checkScroll()
    window.addEventListener('resize', checkScroll)
    navRef.current?.addEventListener('scroll', checkScroll)

    return () => {
      window.removeEventListener('resize', checkScroll)
      navRef.current?.removeEventListener('scroll', checkScroll)
    }
  }, [])

  const handleAddConference = (conference: Conference) => {
    setConferences((current) => [...(current || []), conference])
  }

  const handleToggleAttendance = (conferenceId: string) => {
    if (!currentUser || !attendances) return

    const existingAttendance = attendances.find(
      (a) => a.conferenceId === conferenceId && a.userId === currentUser.login
    )

    if (existingAttendance) {
      setAttendances((current) =>
        (current || []).filter((a) => !(a.conferenceId === conferenceId && a.userId === currentUser.login))
      )
    } else {
      const newAttendance: Attendance = {
        conferenceId,
        userId: currentUser.login,
        userName: currentUser.login,
        userAvatar: currentUser.avatarUrl,
      }
      setAttendances((current) => [...(current || []), newAttendance])
    }
  }

  const handleMVPClick = (userId: string, userName: string, userAvatar: string) => {
    setSelectedMVP({ userId, userName, userAvatar })
  }

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 200
      navRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (selectedMVP) {
    return (
      <MVPProfile
        userId={selectedMVP.userId}
        userName={selectedMVP.userName}
        userAvatar={selectedMVP.userAvatar}
        conferences={conferences || []}
        attendances={attendances || []}
        onBack={() => setSelectedMVP(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
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

      <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-primary to-accent shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-white" size={32} weight="bold" />
            <h1 className="text-white font-bold text-3xl tracking-tight">ConTrails</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollNav('left')}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-primary/90 hover:bg-primary text-white rounded-full p-1 shadow-lg transition-all duration-300",
                showLeftArrow ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              )}
              aria-label="Scroll left"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <button
              onClick={() => scrollNav('right')}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-accent/90 hover:bg-accent text-white rounded-full p-1 shadow-lg transition-all duration-300",
                showRightArrow ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              )}
              aria-label="Scroll right"
            >
              <CaretRight size={20} weight="bold" />
            </button>
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-primary/80 to-transparent pointer-events-none transition-opacity duration-300 z-10",
                showLeftFade ? "opacity-100" : "opacity-0"
              )}
            />
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-accent/80 to-transparent pointer-events-none transition-opacity duration-300 z-10",
                showRightFade ? "opacity-100" : "opacity-0"
              )}
            />
            <nav 
              ref={navRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
            >
              <Button
                variant="ghost"
                onClick={() => setCurrentView('conferences')}
                className={cn(
                  "text-white hover:bg-white/10 flex-shrink-0",
                  currentView === 'conferences' && "bg-white/20"
                )}
              >
                <Globe size={20} weight="bold" className="mr-2" />
                Conferences
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('map')}
                className={cn(
                  "text-white hover:bg-white/10 flex-shrink-0",
                  currentView === 'map' && "bg-white/20"
                )}
              >
                <MapTrifold size={20} weight="bold" className="mr-2" />
                Map
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('analytics')}
                className={cn(
                  "text-white hover:bg-white/10 flex-shrink-0",
                  currentView === 'analytics' && "bg-white/20"
                )}
              >
                <ChartBar size={20} weight="bold" className="mr-2" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('mvps')}
                className={cn(
                  "text-white hover:bg-white/10 flex-shrink-0",
                  currentView === 'mvps' && "bg-white/20"
                )}
              >
                <Users size={20} weight="bold" className="mr-2" />
                MVPs
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {currentView === 'conferences' && (
          <ConferencesView
            conferences={conferences || []}
            attendances={attendances || []}
            currentUser={currentUser}
            onAddConference={handleAddConference}
            onToggleAttendance={handleToggleAttendance}
            onMVPClick={handleMVPClick}
          />
        )}

        {currentView === 'map' && (
          <MapView
            conferences={conferences || []}
            attendances={attendances || []}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            conferences={conferences || []}
            attendances={attendances || []}
          />
        )}

        {currentView === 'mvps' && (
          <MVPsView
            conferences={conferences || []}
            attendances={attendances || []}
            onMVPClick={handleMVPClick}
          />
        )}
      </main>

      <Toaster />
    </div>
  )
}

export default App