import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  CalendarDots, 
  MapPin, 
  TrendUp, 
  Globe,
  User as UserIcon,
  CheckCircle
} from '@phosphor-icons/react'
import { Conference, Attendance } from '@/lib/types'
import { motion } from 'framer-motion'
import { format, parseISO, isPast } from 'date-fns'

interface MVPProfileProps {
  userId: string
  userName: string
  userAvatar: string
  conferences: Conference[]
  attendances: Attendance[]
  onBack: () => void
}

export function MVPProfile({
  userId,
  userName,
  userAvatar,
  conferences,
  attendances,
  onBack
}: MVPProfileProps) {
  const userAttendances = useMemo(() => {
    return attendances.filter(a => a.userId === userId)
  }, [attendances, userId])

  const attendingConferences = useMemo(() => {
    return userAttendances
      .map(attendance => {
        const conference = conferences.find(c => c.id === attendance.conferenceId)
        return conference ? { ...conference, attendance } : null
      })
      .filter((item): item is Conference & { attendance: Attendance } => item !== null)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [userAttendances, conferences])

  const upcomingConferences = useMemo(() => {
    return attendingConferences.filter(conf => !isPast(parseISO(conf.endDate)))
  }, [attendingConferences])

  const pastConferences = useMemo(() => {
    return attendingConferences.filter(conf => isPast(parseISO(conf.endDate)))
  }, [attendingConferences])

  const stats = useMemo(() => {
    const uniqueCountries = new Set(attendingConferences.map(c => c.country)).size
    const allTopics = attendingConferences.flatMap(c => c.topics)
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return {
      totalConferences: attendingConferences.length,
      upcomingCount: upcomingConferences.length,
      pastCount: pastConferences.length,
      uniqueCountries,
      topTopics
    }
  }, [attendingConferences, upcomingConferences, pastConferences])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDateRange = (conference: Conference) => {
    const start = parseISO(conference.startDate)
    const end = parseISO(conference.endDate)
    const startFormatted = format(start, 'MMM d')
    const endFormatted = format(end, 'd, yyyy')
    
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${startFormatted}-${endFormatted}`
    }
    return `${startFormatted} - ${format(end, 'MMM d, yyyy')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
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

      <div className="container mx-auto px-6 py-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2" weight="bold" />
          Back to Conferences
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{userName}</h1>
                  <Badge variant="secondary" className="text-xs">
                    <UserIcon size={14} className="mr-1" weight="fill" />
                    Security MVP
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Conference attendance history and upcoming events
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Conferences</p>
                <p className="text-3xl font-bold text-primary">{stats.totalConferences}</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground font-medium mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-accent">{stats.upcomingCount}</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground font-medium mb-1">Attended</p>
                <p className="text-3xl font-bold text-primary">{stats.pastCount}</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground font-medium mb-1">Countries</p>
                <p className="text-3xl font-bold text-accent">{stats.uniqueCountries}</p>
              </div>
            </Card>
          </div>

          {stats.topTopics.length > 0 && (
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendUp size={20} weight="bold" className="text-primary" />
                <h3 className="font-semibold text-lg">Top Topics of Interest</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.topTopics.map(([topic, count]) => (
                  <Badge key={topic} variant="secondary" className="text-sm">
                    {topic} <span className="ml-1.5 text-xs opacity-70">×{count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {upcomingConferences.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <CalendarDots size={28} weight="bold" className="text-primary" />
                <h2 className="text-2xl font-bold">Upcoming Conferences</h2>
                <span className="text-muted-foreground text-sm">({upcomingConferences.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingConferences.map((conference) => (
                  <Card 
                    key={conference.id} 
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 border-2 border-accent/30 hover:-translate-y-1"
                  >
                    <div className="h-24 bg-gradient-to-br from-primary to-accent relative">
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle size={14} weight="fill" className="mr-1" />
                          Attending
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-white font-semibold text-base line-clamp-2 drop-shadow-md">
                          {conference.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDots size={16} className="shrink-0" />
                          <span className="font-medium">{formatDateRange(conference)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin size={16} className="shrink-0" />
                          <span>{conference.location}, {conference.country}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {conference.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {conference.topics.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{conference.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastConferences.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Globe size={28} weight="bold" className="text-muted-foreground" />
                <h2 className="text-2xl font-bold">Past Conferences</h2>
                <span className="text-muted-foreground text-sm">({pastConferences.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastConferences.map((conference) => (
                  <Card 
                    key={conference.id} 
                    className="overflow-hidden opacity-75 hover:opacity-100 transition-opacity duration-200"
                  >
                    <div className="h-24 bg-gradient-to-br from-muted to-muted-foreground/20 relative">
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-foreground/80 font-semibold text-base line-clamp-2 drop-shadow-sm">
                          {conference.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDots size={16} className="shrink-0" />
                          <span className="font-medium">{formatDateRange(conference)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin size={16} className="shrink-0" />
                          <span>{conference.location}, {conference.country}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {conference.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {conference.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{conference.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {attendingConferences.length === 0 && (
            <Card className="p-12 text-center">
              <Globe size={64} className="mx-auto mb-4 text-muted-foreground" weight="duotone" />
              <h3 className="text-xl font-semibold mb-2">No Conference Attendance Yet</h3>
              <p className="text-muted-foreground">
                This MVP hasn't marked attendance for any conferences yet.
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
