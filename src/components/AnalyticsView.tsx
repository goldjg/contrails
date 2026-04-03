import { StatisticsSection } from '@/components/StatisticsSection'
import { Conference, Attendance } from '@/lib/types'
import { ChartBar } from '@phosphor-icons/react'

interface AnalyticsViewProps {
  conferences: Conference[]
  attendances: Attendance[]
}

export function AnalyticsView({ conferences, attendances }: AnalyticsViewProps) {
  if (conferences.length === 0) {
    return (
      <div className="text-center py-20">
        <ChartBar className="mx-auto mb-4 text-muted-foreground" size={64} />
        <h2 className="text-2xl font-semibold mb-2">No Analytics Available</h2>
        <p className="text-muted-foreground">
          Add conferences to see analytics and trends.
        </p>
      </div>
    )
  }

  return (
    <div>
      <StatisticsSection 
        conferences={conferences}
        attendances={attendances}
      />
    </div>
  )
}
