import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CalendarDots, MapPin, Users, Check, Plus, CaretDown, CaretUp } from '@phosphor-icons/react'
import { Conference, Attendance } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'

interface ConferenceCardProps {
  conference: Conference
  attendances: Attendance[]
  isUserAttending: boolean
  onToggleAttendance: () => void
  currentUser: { login: string; avatarUrl: string }
  onMVPClick?: (userId: string, userName: string, userAvatar: string) => void
}

export function ConferenceCard({
  conference,
  attendances,
  isUserAttending,
  onToggleAttendance,
  currentUser,
  onMVPClick
}: ConferenceCardProps) {
  const [showAttendees, setShowAttendees] = useState(false)

  const formatDateRange = () => {
    const start = parseISO(conference.startDate)
    const end = parseISO(conference.endDate)
    const startFormatted = format(start, 'MMM d')
    const endFormatted = format(end, 'd, yyyy')
    
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${startFormatted}-${endFormatted}`
    }
    return `${startFormatted} - ${format(end, 'MMM d, yyyy')}`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-2 hover:-translate-y-1 bg-gradient-to-br from-primary to-accent" 
            style={{ borderColor: isUserAttending ? 'oklch(0.70 0.15 200)' : undefined }}>
        <div className="h-32 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-white font-semibold text-xl line-clamp-2 drop-shadow-md">
              {conference.name}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDots className="shrink-0" />
              <span className="font-medium">{formatDateRange()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="shrink-0" />
              <span>{conference.location}, {conference.country}</span>
            </div>
          </div>

          <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
            {conference.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {conference.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users />
                <span className="font-medium">
                  {attendances.length} {attendances.length === 1 ? 'MVP' : 'MVPs'} attending
                </span>
              </div>
              
              <Button
                size="sm"
                variant={isUserAttending ? "default" : "outline"}
                onClick={onToggleAttendance}
                className={isUserAttending ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isUserAttending ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {isUserAttending ? <Check weight="bold" /> : <Plus weight="bold" />}
                  {isUserAttending ? "Attending" : "I'm Going"}
                </motion.div>
              </Button>
            </div>

            {attendances.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAttendees(!showAttendees)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  {showAttendees ? <CaretUp /> : <CaretDown />}
                  <span>{showAttendees ? 'Hide' : 'Show'} attendees</span>
                </button>

                <AnimatePresence>
                  {showAttendees && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {attendances.map((attendance) => (
                          <button
                            key={attendance.userId}
                            onClick={() => onMVPClick?.(attendance.userId, attendance.userName, attendance.userAvatar)}
                            className="w-full flex items-center gap-3 p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-left"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={attendance.userAvatar} alt={attendance.userName} />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {getInitials(attendance.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {attendance.userName}
                              {attendance.userId === currentUser.login && (
                                <span className="text-xs text-muted-foreground ml-1">(you)</span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {attendances.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-2">
                Be the first MVP to attend! 🚀
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
