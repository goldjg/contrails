import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Conference, Attendance } from '@/lib/types'
import { Users, MagnifyingGlass, MapPin, CalendarDots, TrendUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface MVPsViewProps {
  conferences: Conference[]
  attendances: Attendance[]
  onMVPClick: (userId: string, userName: string, userAvatar: string) => void
}

export function MVPsView({ conferences, attendances, onMVPClick }: MVPsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const mvpData = useMemo(() => {
    const mvpMap = new Map<string, {
      userId: string
      userName: string
      userAvatar: string
      attendanceCount: number
      conferences: Conference[]
      countries: Set<string>
    }>()

    attendances.forEach(attendance => {
      const conference = conferences.find(c => c.id === attendance.conferenceId)
      if (!conference) return

      const existing = mvpMap.get(attendance.userId)
      if (existing) {
        existing.attendanceCount++
        existing.conferences.push(conference)
        existing.countries.add(conference.country)
      } else {
        mvpMap.set(attendance.userId, {
          userId: attendance.userId,
          userName: attendance.userName,
          userAvatar: attendance.userAvatar,
          attendanceCount: 1,
          conferences: [conference],
          countries: new Set([conference.country])
        })
      }
    })

    return Array.from(mvpMap.values()).sort((a, b) => b.attendanceCount - a.attendanceCount)
  }, [conferences, attendances])

  const filteredMVPs = useMemo(() => {
    if (!searchQuery) return mvpData
    const query = searchQuery.toLowerCase()
    return mvpData.filter(mvp => 
      mvp.userName.toLowerCase().includes(query) ||
      mvp.userId.toLowerCase().includes(query)
    )
  }, [mvpData, searchQuery])

  if (mvpData.length === 0) {
    return (
      <div className="text-center py-20">
        <Users className="mx-auto mb-4 text-muted-foreground" size={64} />
        <h2 className="text-2xl font-semibold mb-2">No MVPs Attending</h2>
        <p className="text-muted-foreground">
          When MVPs mark their conference attendance, they'll appear here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-xl">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mvp-search"
            type="text"
            placeholder="Search MVPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMVPs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No MVPs match your search.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Users size={28} weight="bold" className="text-primary" />
            <h2 className="text-2xl font-bold">Active MVPs</h2>
            <span className="text-muted-foreground text-sm">({filteredMVPs.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMVPs.map((mvp) => (
              <Card 
                key={mvp.userId} 
                className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={mvp.userAvatar} alt={mvp.userName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {mvp.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{mvp.userName}</h3>
                    <p className="text-sm text-muted-foreground truncate">@{mvp.userId}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDots size={18} className="text-primary" weight="bold" />
                      <span className="font-medium">Conferences</span>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      {mvp.attendanceCount}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={18} className="text-accent" weight="bold" />
                      <span className="font-medium">Countries</span>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">
                      {mvp.countries.size}
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => onMVPClick(mvp.userId, mvp.userName, mvp.userAvatar)}
                  className="w-full"
                  variant="outline"
                >
                  <TrendUp size={18} className="mr-2" weight="bold" />
                  View Profile
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
