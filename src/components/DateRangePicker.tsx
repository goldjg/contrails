import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } 
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange | und


  }
  const formatDateRange = () => {
      return 'Pick a date range'
 

  }
  return (
      <PopoverTrigger asChild>
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
      </PopoverContent>
  )






























      </PopoverContent>
    </Popover>
  )
}
