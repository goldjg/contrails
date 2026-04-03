import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { ConferenceCard } from '@/components/ConferenceCard'
import { AddConferenceDialog } from '@/components/AddConferenceDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Conference, Attendance } from '@/lib/types'
import { PlusCircle, MagnifyingGlass, Globe } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { isPast, parseISO } from 'date-fns'

function App() {
  const [conferences, setConferences] = useKV<Conference[]>('conferences', [])
  const [attendances, setAttendances] = useKV<Attendance[]>('attendances', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ login: string; avatarUrl: string; isOwner: boolean } | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const user = await spark.user()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  const filteredConferences = useMemo(() => {
    if (!conferences) return []
    if (!searchQuery) return conferences

    const query = searchQuery.toLowerCase()
    return conferences.filter(
      (conf) =>
        conf.name.toLowerCase().includes(query) ||
        conf.location.toLowerCase().includes(query) ||
        conf.country.toLowerCase().includes(query) ||
        conf.topics.some((topic) => topic.toLowerCase().includes(query))
    )
  }, [conferences, searchQuery])

  const upcomingConferences = useMemo(() => {
    if (!filteredConferences) return []
    return filteredConferences
      .filter((conf) => !isPast(parseISO(conf.endDate)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [filteredConferences])

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

  const getConferenceAttendances = (conferenceId: string) => {
    if (!attendances) return []
    return attendances.filter((a) => a.conferenceId === conferenceId)
  }

  const isUserAttending = (conferenceId: string) => {
    if (!currentUser || !attendances) return false
    return attendances.some((a) => a.conferenceId === conferenceId && a.userId === currentUser.login)
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
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Globe className="text-white" size={32} weight="bold" />
              <h1 className="text-white font-bold text-3xl tracking-tight">ConTrails</h1>
            </div>
            {currentUser.isOwner && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-white text-primary hover:bg-white/90"
              >
                <PlusCircle weight="bold" className="mr-2" />
                Add Conference
              </Button>
            )}
          </div>

          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search conferences, locations, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/95 border-white/20"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {upcomingConferences.length === 0 && !searchQuery && (
          <div className="text-center py-20">
            <Globe className="mx-auto mb-4 text-muted-foreground" size={64} />
            <h2 className="text-2xl font-semibold mb-2">No Conferences Yet</h2>
            <p className="text-muted-foreground mb-6">
              {currentUser.isOwner
                ? 'Start by adding your first cyber security conference!'
                : 'Check back soon for upcoming cyber security conferences.'}
            </p>
            {currentUser.isOwner && (
              <Button onClick={() => setDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle weight="bold" className="mr-2" />
                Add First Conference
              </Button>
            )}
          </div>
        )}

        {upcomingConferences.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No conferences match your search.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingConferences.map((conference) => (
            <ConferenceCard
              key={conference.id}
              conference={conference}
              attendances={getConferenceAttendances(conference.id)}
              isUserAttending={isUserAttending(conference.id)}
              onToggleAttendance={() => handleToggleAttendance(conference.id)}
              currentUser={currentUser}
            />
          ))}
        </div>
      </main>

      <AddConferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddConference}
      />

      <Toaster />
    </div>
  )
}

export default App