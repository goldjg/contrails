import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigge
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank } from '@phosphor-icons/react'
import { DateRange } from 'react-day-picker'
  dateRange: DateRange | undefine
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range)

  }

  const formatDateRange = () => {
    if (!dateRange?.from) {
      return 'Pick a date range'
    }
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
    }
      <PopoverContent className="w-auto p-0" ali
  }

  return (
        />
      <PopoverTrigger asChild>
  )
          variant="outline"




















