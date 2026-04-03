import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const handleClear = () => {
    onDateRangeChange(undefined)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return 'All Dates'
    if (!dateRange.to) return format(dateRange.from, 'MMM d, yyyy')
    return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
  }

  return (
    <div className="flex items-center gap-2 min-w-[220px]">
      <CalendarBlank className="text-white" size={20} weight="bold" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-white/95 border-white/20"
          >
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
          {dateRange?.from && (
            <div className="border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="w-full"
              >
                <X className="mr-2" />
                Clear Dates
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
