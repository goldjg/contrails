import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { format } from 'date-fns'
interface DateRangePickerProps {
  onDateRangeChange: (range: Dat

  const handleSelect = (range: DateRange | undefi

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange | undefined) => void
}

  }
  return (

          variant="outline"
            'justify-st
          )}
   

      <PopoverContent className="
          mode="range"
          onSelect={handleSelect
     
    </Popover>
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


