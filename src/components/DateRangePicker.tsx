import { Button } from '@/compon
import { Calendar } from '@/components/ui/calen
import { CalendarBlank } from '@phosphor-icons/react'
import { DateRange } from 'react-day-picker'
interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange | undefined) =

  const handleSelect = (range: DateRange | u

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

            'justify-start text-left font-normal',
            !dateRange && 'text-muted-foreground'
          )}
        >
          <CalendarBlank className="mr-2" size={16} />

        </Button>

      <PopoverContent className="w-auto p-0" align="start">

          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />

    </Popover>

}
