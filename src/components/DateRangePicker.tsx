import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const handleClear = () => {
    onDateRangeChange(undefined)
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
            'justify-start text-left font-normal min-w-[280px]',
            !dateRange?.from && 'text-muted-foreground'
          )}
        >
          <CalendarBlank size={20} weight="bold" className="mr-2" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={onDateRangeChange}
          initialFocus
          defaultMonth={dateRange?.from}
          numberOfMonths={2}
        />
        {dateRange?.from && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full"
            >
              <X size={16} weight="bold" className="mr-2" />
              Clear Dates
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
