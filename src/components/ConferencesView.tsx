import { useState, useMemo } from 'react'
import { ConferenceCard } from '@/components/ConferenceCard'
import { AddConferenceDialog } from '@/components/AddConferenceDialog'
import { DateRangePicker } from '@/components/DateRangePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Conference, Attendance } from '@/lib/types'
import { PlusCircle, MagnifyingGlass, Globe, SortAscending, MapPin, Tag } from '@phosphor-icons/react'
import { isPast, parseISO, isWithinInterval } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SortOption = 'date-asc' | 'date-desc' | 'name-asc'
type FilterLocation = 'all' | string
type FilterTopic = 'all' | string

interface ConferencesViewProps {
  conferences: Conference[]
  attendances: Attendance[]
  currentUser: { login: string; avatarUrl: string; isOwner: boolean }
  onAddConference: (conference: Conference) => void
  onToggleAttendance: (conferenceId: string) => void
  onMVPClick: (userId: string, userName: string, userAvatar: string) => void
}

export function ConferencesView({
  conferences,
  attendances,
  currentUser,
  onAddConference,
  onToggleAttendance,
  onMVPClick
}: ConferencesViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-asc')
  const [filterLocation, setFilterLocation] = useState<FilterLocation>('all')
  const [filterTopic, setFilterTopic] = useState<FilterTopic>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)

  const uniqueLocations = useMemo(() => {
    if (!conferences) return []
    const locations = new Set(conferences.map(conf => conf.country))
    return Array.from(locations).sort()
  }, [conferences])

  const uniqueTopics = useMemo(() => {
    if (!conferences) return []
    const topics = new Set(conferences.flatMap(conf => conf.topics))
    return Array.from(topics).sort()
  }, [conferences])

  const filteredConferences = useMemo(() => {
    if (!conferences) return []
    
    let filtered = conferences.filter(conf => !isPast(parseISO(conf.endDate)))

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (conf) =>
          conf.name.toLowerCase().includes(query) ||
          conf.location.toLowerCase().includes(query) ||
          conf.country.toLowerCase().includes(query) ||
          conf.topics.some((topic) => topic.toLowerCase().includes(query))
      )
    }

    if (filterLocation !== 'all') {
      filtered = filtered.filter(conf => conf.country === filterLocation)
    }

    if (filterTopic !== 'all') {
      filtered = filtered.filter(conf => conf.topics.includes(filterTopic))
    }

    if (dateRange?.from) {
      filtered = filtered.filter(conf => {
        const confStart = parseISO(conf.startDate)
        const confEnd = parseISO(conf.endDate)
        
        if (!dateRange.from) return true
        
        if (dateRange.to) {
          return (
            isWithinInterval(confStart, { start: dateRange.from, end: dateRange.to }) ||
            isWithinInterval(confEnd, { start: dateRange.from, end: dateRange.to }) ||
            (confStart <= dateRange.from && confEnd >= dateRange.to)
          )
        } else {
          return isWithinInterval(dateRange.from, { start: confStart, end: confEnd })
        }
      })
    }

    const sorted = [...filtered]
    switch (sortBy) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        break
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return sorted
  }, [conferences, searchQuery, filterLocation, filterTopic, dateRange, sortBy])

  const getConferenceAttendances = (conferenceId: string) => {
    if (!attendances) return []
    return attendances.filter((a) => a.conferenceId === conferenceId)
  }

  const isUserAttending = (conferenceId: string) => {
    if (!currentUser || !attendances) return false
    return attendances.some((a) => a.conferenceId === conferenceId && a.userId === currentUser.login)
  }

  const handleAddConference = (conference: Conference) => {
    onAddConference(conference)
    setDialogOpen(false)
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative max-w-xl">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search conferences, locations, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {currentUser.isOwner && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <PlusCircle weight="bold" className="mr-2" />
              Add Conference
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          <div className="flex items-center gap-2 min-w-[180px]">
            <SortAscending size={20} weight="bold" className="text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                <SelectItem value="date-desc">Date (Latest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <MapPin size={20} weight="bold" className="text-muted-foreground" />
            <Select value={filterLocation} onValueChange={(value) => setFilterLocation(value as FilterLocation)}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 min-w-[180px]">
            <Tag size={20} weight="bold" className="text-muted-foreground" />
            <Select value={filterTopic} onValueChange={(value) => setFilterTopic(value as FilterTopic)}>
              <SelectTrigger>
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {uniqueTopics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredConferences.length === 0 && !searchQuery && filterLocation === 'all' && filterTopic === 'all' && !dateRange?.from && (
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

      {filteredConferences.length === 0 && (searchQuery || filterLocation !== 'all' || filterTopic !== 'all' || dateRange?.from) && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No conferences match your filters.</p>
        </div>
      )}

      {filteredConferences.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Globe size={28} weight="bold" className="text-primary" />
            <h2 className="text-2xl font-bold">Upcoming Conferences</h2>
            <span className="text-muted-foreground text-sm">({filteredConferences.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConferences.map((conference) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                attendances={getConferenceAttendances(conference.id)}
                isUserAttending={isUserAttending(conference.id)}
                onToggleAttendance={() => onToggleAttendance(conference.id)}
                currentUser={currentUser}
                onMVPClick={onMVPClick}
              />
            ))}
          </div>
        </div>
      )}

      <AddConferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddConference}
      />
    </div>
  )
}
