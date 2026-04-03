import { useMemo, useState } from 'react'
import { Conference, Attendance } from '@/lib/types'
import { MapPin, Users } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'

interface MapViewProps {
  conferences: Conference[]
  attendances: Attendance[]
}

interface ConferenceWithCount extends Conference {
  attendanceCount: number
}

function getColorForAttendanceCount(count: number): {
  color: string
  label: string
  bgColor: string
  borderColor: string
} {
  if (count === 0) {
    return {
      color: 'oklch(0.60 0.01 240)',
      label: '0 Attending',
      bgColor: 'oklch(0.96 0.005 240)',
      borderColor: 'oklch(0.88 0.01 240)'
    }
  } else if (count <= 5) {
    return {
      color: 'oklch(0.65 0.22 120)',
      label: '1-5 Attending',
      bgColor: 'oklch(0.95 0.08 120)',
      borderColor: 'oklch(0.65 0.22 120)'
    }
  } else if (count <= 10) {
    return {
      color: 'oklch(0.70 0.25 60)',
      label: '5-10 Attending',
      bgColor: 'oklch(0.95 0.10 60)',
      borderColor: 'oklch(0.70 0.25 60)'
    }
  } else {
    return {
      color: 'oklch(0.55 0.22 25)',
      label: '>10 Attending',
      bgColor: 'oklch(0.95 0.10 25)',
      borderColor: 'oklch(0.55 0.22 25)'
    }
  }
}

export function MapView({ conferences, attendances }: MapViewProps) {
  const [selectedConference, setSelectedConference] = useState<ConferenceWithCount | null>(null)

  const conferencesWithCounts = useMemo(() => {
    return conferences
      .filter(conf => conf.coordinates)
      .map(conf => ({
        ...conf,
        attendanceCount: attendances.filter(a => a.conferenceId === conf.id).length
      }))
  }, [conferences, attendances])

  const legendItems = [
    { label: '0 Attending', color: 'oklch(0.60 0.01 240)' },
    { label: '1-5 Attending', color: 'oklch(0.65 0.22 120)' },
    { label: '5-10 Attending', color: 'oklch(0.70 0.25 60)' },
    { label: '>10 Attending', color: 'oklch(0.55 0.22 25)' }
  ]

  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100
    const latRad = (lat * Math.PI) / 180
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
    const y = (1 - mercN / Math.PI) * 50
    return { x, y }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin size={28} weight="bold" className="text-primary" />
          <h2 className="text-2xl font-bold">Conference Map</h2>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold text-muted-foreground">Legend:</span>
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden border-2 border-border shadow-lg"
          style={{ 
            aspectRatio: '2/1',
            backgroundImage: `
              linear-gradient(to right, oklch(0.85 0.02 240 / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(0.85 0.02 240 / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        >
          <svg
            viewBox="0 0 100 50"
            className="absolute inset-0 w-full h-full"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          >
            <path
              d="M 15,20 L 12,18 L 10,20 L 8,22 L 7,25 L 8,28 L 10,30 L 15,32 L 20,30 L 22,28 L 24,25 L 22,22 L 20,20 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
            
            <path
              d="M 30,15 L 28,12 L 25,10 L 22,12 L 20,15 L 22,18 L 25,20 L 30,22 L 35,20 L 40,18 L 42,15 L 40,12 L 35,10 L 32,12 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
            
            <path
              d="M 45,18 L 42,15 L 40,18 L 42,22 L 45,25 L 50,27 L 55,25 L 58,22 L 60,18 L 58,15 L 55,12 L 50,10 L 47,12 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
            
            <path
              d="M 70,25 L 68,22 L 65,20 L 62,22 L 60,25 L 62,30 L 65,35 L 70,37 L 75,35 L 78,30 L 80,25 L 78,22 L 75,20 L 72,22 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
            
            <path
              d="M 85,28 L 82,25 L 80,28 L 78,32 L 80,35 L 83,37 L 88,38 L 92,36 L 94,32 L 92,28 L 88,26 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
            
            <path
              d="M 10,35 L 8,32 L 6,35 L 8,40 L 12,42 L 16,40 L 18,35 L 16,32 L 12,30 Z"
              fill="oklch(0.75 0.05 240 / 0.15)"
              stroke="oklch(0.65 0.08 240 / 0.4)"
              strokeWidth="0.15"
            />
          </svg>

          {conferencesWithCounts.map((conference) => {
            if (!conference.coordinates) return null
            const { x, y } = projectCoordinates(conference.coordinates.lat, conference.coordinates.lng)
            const colorData = getColorForAttendanceCount(conference.attendanceCount)
            
            return (
              <button
                key={conference.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-150 focus:scale-150 focus:outline-none group cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`
                }}
                onClick={() => setSelectedConference(conference)}
                onMouseEnter={() => setSelectedConference(conference)}
              >
                <div className="relative">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg border-2 transition-all duration-200 group-hover:shadow-xl"
                    style={{
                      backgroundColor: colorData.color,
                      borderColor: 'white',
                      boxShadow: `0 0 0 2px ${colorData.color}, 0 4px 12px ${colorData.color}40`
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      backgroundColor: colorData.color,
                      opacity: 0.3
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {selectedConference && (
        <Card className="p-6 border-2"
          style={{
            borderColor: getColorForAttendanceCount(selectedConference.attendanceCount).borderColor,
            backgroundColor: getColorForAttendanceCount(selectedConference.attendanceCount).bgColor
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">{selectedConference.name}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{selectedConference.location}, {selectedConference.country}</span>
                <span>•</span>
                <span>
                  {format(parseISO(selectedConference.startDate), 'MMM d')} - {format(parseISO(selectedConference.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-base font-semibold px-3 py-1"
                style={{
                  backgroundColor: getColorForAttendanceCount(selectedConference.attendanceCount).color,
                  color: 'white'
                }}
              >
                <Users weight="bold" className="mr-2" size={18} />
                {selectedConference.attendanceCount} {selectedConference.attendanceCount === 1 ? 'Person' : 'People'} Attending
              </Badge>
            </div>

            <p className="text-sm text-foreground/80">{selectedConference.description}</p>

            {selectedConference.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedConference.topics.map((topic) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {!selectedConference && (
        <Card className="p-12 text-center border-dashed">
          <MapPin size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Click on a pin to see conference details
          </p>
        </Card>
      )}
    </div>
  )
}
