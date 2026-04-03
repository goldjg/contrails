import { useMemo, useState, useEffect, useRef } from 'react'
import { Conference, Attendance } from '@/lib/types'
import { MapPin, Users } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

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
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })

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

  useEffect(() => {
    if (!svgRef.current) return

    const container = svgRef.current.parentElement
    if (!container) return

    const updateDimensions = () => {
      const width = container.clientWidth
      const height = width / 2
      setDimensions({ width, height })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const projection = d3.geoNaturalEarth1()
      .scale(dimensions.width / 6)
      .translate([dimensions.width / 2, dimensions.height / 2])

    const pathGenerator = d3.geoPath().projection(projection)

    const graticule = d3.geoGraticule()

    svg.append('rect')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('fill', 'oklch(0.92 0.02 220)')

    svg.append('path')
      .datum(graticule())
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.85 0.01 220)')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.4)

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then((topology: Topology) => {
        const countries = feature(topology, topology.objects.countries as GeometryCollection)

        svg.append('g')
          .selectAll('path')
          .data(countries.features)
          .join('path')
          .attr('d', pathGenerator)
          .attr('fill', 'oklch(0.80 0.03 240)')
          .attr('stroke', 'oklch(0.70 0.04 240)')
          .attr('stroke-width', 0.5)
          .attr('class', 'country')
          .style('transition', 'fill 0.2s ease')
          .on('mouseenter', function() {
            d3.select(this).attr('fill', 'oklch(0.75 0.05 240)')
          })
          .on('mouseleave', function() {
            d3.select(this).attr('fill', 'oklch(0.80 0.03 240)')
          })

        const markers = svg.append('g').attr('class', 'markers')

        conferencesWithCounts.forEach(conference => {
          if (!conference.coordinates) return

          const [x, y] = projection([conference.coordinates.lng, conference.coordinates.lat]) || [0, 0]
          const colorData = getColorForAttendanceCount(conference.attendanceCount)

          const markerGroup = markers.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .attr('class', 'marker-group')
            .style('cursor', 'pointer')
            .on('click', () => setSelectedConference(conference))
            .on('mouseenter', () => setSelectedConference(conference))

          markerGroup.append('circle')
            .attr('r', 8)
            .attr('fill', colorData.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('opacity', 0.9)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
            .style('transition', 'all 0.2s ease')

          markerGroup.append('circle')
            .attr('r', 12)
            .attr('fill', colorData.color)
            .attr('opacity', 0.2)
            .attr('class', 'pulse-ring')

          markerGroup
            .on('mouseenter', function() {
              d3.select(this).select('circle:first-child')
                .transition()
                .duration(200)
                .attr('r', 12)
            })
            .on('mouseleave', function() {
              d3.select(this).select('circle:first-child')
                .transition()
                .duration(200)
                .attr('r', 8)
            })
        })
      })
      .catch(error => {
        console.error('Error loading world map:', error)
      })
  }, [dimensions, conferencesWithCounts])

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

        <div className="relative w-full rounded-lg overflow-hidden border-2 border-border shadow-lg">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-auto"
          />
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
