import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
interface DateRangePickerProps {
  onDateRangeChange: (range: Date


  const handleClear = () => {
  }
  const formatDateRange = () => {
 

  return (
      <CalendarBlank className="text-whit

            variant="outline"
          >
   

            initialFocus
            defaultMonth={dateRange?.from}
            onSelect={onDateRangeChange}
          />
   

          
              >
                Clear Dates
            </div>
        </PopoverContent>
    </div>
}
































