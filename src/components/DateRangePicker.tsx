import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const handleSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return 'Pick a date range'
    }
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
    }
    return format(dateRange.from, 'MMM d, yyyy')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !dateRange && 'text-muted-foreground'
          )}
        >
          <CalendarBlank className="mr-2" size={16} />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
