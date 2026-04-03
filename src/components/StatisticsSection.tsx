import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Conference, Attendance } from '@/lib/types'
import { 
  Globe, 
  CalendarDots, 
  Users, 
  TrendUp, 
  MapPin, 
  Tag,
  ChartBar
} from '@phosphor-icons/react'
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns'
import { motion } from 'framer-motion'

interface StatisticsSectionProps {
  conferences: Conference[]
  attendances: Attendance[]
}

export function StatisticsSection({ conferences, attendances }: StatisticsSectionProps) {
  const stats = useMemo(() => {
    const totalConferences = conferences.length
    const totalAttendances = attendances.length
    const avgAttendancePerConf = totalConferences > 0 
      ? (totalAttendances / totalConferences).toFixed(1) 
      : '0'

    const uniqueCountries = new Set(conferences.map(c => c.country)).size
    const uniqueAttendees = new Set(attendances.map(a => a.userId)).size

    const conferencesByMonth = conferences.reduce((acc, conf) => {
      const monthKey = format(parseISO(conf.startDate), 'MMM yyyy')
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const attendancesByMonth = conferences.reduce((acc, conf) => {
      const monthKey = format(parseISO(conf.startDate), 'MMM yyyy')
      const confAttendances = attendances.filter(a => a.conferenceId === conf.id).length
      acc[monthKey] = (acc[monthKey] || 0) + confAttendances
      return acc
    }, {} as Record<string, number>)

    const topCountries = Object.entries(
      conferences.reduce((acc, conf) => {
        acc[conf.country] = (acc[conf.country] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const topTopics = Object.entries(
      conferences.reduce((acc, conf) => {
        conf.topics.forEach(topic => {
          acc[topic] = (acc[topic] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const mostPopularConferences = conferences
      .map(conf => ({
        conference: conf,
        attendeeCount: attendances.filter(a => a.conferenceId === conf.id).length
      }))
      .sort((a, b) => b.attendeeCount - a.attendeeCount)
      .slice(0, 5)
      .filter(item => item.attendeeCount > 0)

    const monthlyTrends = Object.entries(conferencesByMonth)
      .map(([month, count]) => ({
        month,
        conferences: count,
        attendances: attendancesByMonth[month] || 0
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })

    return {
      totalConferences,
      totalAttendances,
      avgAttendancePerConf,
      uniqueCountries,
      uniqueAttendees,
      topCountries,
      topTopics,
      mostPopularConferences,
      monthlyTrends
    }
  }, [conferences, attendances])

  if (conferences.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <ChartBar size={28} weight="bold" className="text-primary" />
        <h2 className="text-2xl font-bold">Conference Statistics & Trends</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Total Conferences</p>
              <p className="text-3xl font-bold text-primary">{stats.totalConferences}</p>
            </div>
            <Globe size={32} weight="duotone" className="text-primary/40" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Total Attendances</p>
              <p className="text-3xl font-bold text-accent">{stats.totalAttendances}</p>
            </div>
            <Users size={32} weight="duotone" className="text-accent/40" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Unique MVPs</p>
              <p className="text-3xl font-bold text-primary">{stats.uniqueAttendees}</p>
            </div>
            <TrendUp size={32} weight="duotone" className="text-primary/40" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Avg Per Event</p>
              <p className="text-3xl font-bold text-accent">{stats.avgAttendancePerConf}</p>
            </div>
            <CalendarDots size={32} weight="duotone" className="text-accent/40" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} weight="bold" className="text-primary" />
            <h3 className="font-semibold text-lg">Top Locations</h3>
          </div>
          <div className="space-y-3">
            {stats.topCountries.length > 0 ? (
              stats.topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 rounded-full bg-accent transition-all duration-500"
                      style={{ 
                        width: `${(count / stats.totalConferences) * 100}px`,
                        minWidth: '20px'
                      }}
                    />
                    <Badge variant="secondary" className="text-xs font-semibold min-w-[2rem] justify-center">
                      {count}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No location data available</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={20} weight="bold" className="text-primary" />
            <h3 className="font-semibold text-lg">Popular Topics</h3>
          </div>
          <div className="space-y-3">
            {stats.topTopics.length > 0 ? (
              stats.topTopics.map(([topic, count], index) => (
                <div key={topic} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 rounded-full bg-accent transition-all duration-500"
                      style={{ 
                        width: `${(count / stats.totalConferences) * 80}px`,
                        minWidth: '20px'
                      }}
                    />
                    <Badge variant="secondary" className="text-xs font-semibold min-w-[2rem] justify-center">
                      {count}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No topic data available</p>
            )}
          </div>
        </Card>
      </div>

      {stats.mostPopularConferences.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} weight="bold" className="text-primary" />
            <h3 className="font-semibold text-lg">Most Popular Conferences</h3>
          </div>
          <div className="space-y-3">
            {stats.mostPopularConferences.map((item, index) => (
              <div 
                key={item.conference.id} 
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.conference.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDots size={14} />
                        {format(parseISO(item.conference.startDate), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {item.conference.location}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-accent text-accent-foreground shrink-0">
                  <Users size={14} className="mr-1" />
                  {item.attendeeCount}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats.monthlyTrends.length > 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDots size={20} weight="bold" className="text-primary" />
            <h3 className="font-semibold text-lg">Monthly Trends</h3>
          </div>
          <div className="space-y-4">
            {stats.monthlyTrends.map((trend) => (
              <div key={trend.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{trend.month}</span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{trend.conferences} {trend.conferences === 1 ? 'conference' : 'conferences'}</span>
                    <span>·</span>
                    <span>{trend.attendances} {trend.attendances === 1 ? 'attendance' : 'attendances'}</span>
                  </div>
                </div>
                <div className="flex gap-2 h-8">
                  <div className="flex-1 relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary/20 rounded transition-all duration-500"
                      style={{ 
                        width: `${(trend.conferences / Math.max(...stats.monthlyTrends.map(t => t.conferences))) * 100}%`,
                        minWidth: trend.conferences > 0 ? '4%' : '0%'
                      }}
                    />
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(trend.conferences / Math.max(...stats.monthlyTrends.map(t => t.conferences))) * 100}%`,
                        minWidth: trend.conferences > 0 ? '4%' : '0%'
                      }}
                    >
                      {trend.conferences > 0 && (
                        <span className="text-xs font-bold text-primary-foreground">{trend.conferences}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <div 
                      className="absolute inset-y-0 left-0 bg-accent/20 rounded transition-all duration-500"
                      style={{ 
                        width: `${(trend.attendances / Math.max(...stats.monthlyTrends.map(t => t.attendances))) * 100}%`,
                        minWidth: trend.attendances > 0 ? '4%' : '0%'
                      }}
                    />
                    <div 
                      className="absolute inset-y-0 left-0 bg-accent rounded transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(trend.attendances / Math.max(...stats.monthlyTrends.map(t => t.attendances))) * 100}%`,
                        minWidth: trend.attendances > 0 ? '4%' : '0%'
                      }}
                    >
                      {trend.attendances > 0 && (
                        <span className="text-xs font-bold text-accent-foreground">{trend.attendances}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <span className="text-muted-foreground">Conferences</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded" />
                    <span className="text-muted-foreground">Attendances</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  )
}
