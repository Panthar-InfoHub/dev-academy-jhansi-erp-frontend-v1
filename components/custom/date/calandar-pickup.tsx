"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMonths, subMonths, getYear, getMonth, setMonth, setYear } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedCalendarProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
}

export function EnhancedCalendar({ selected, onSelect, className, disabled }: EnhancedCalendarProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(selected || new Date())

  // Generate years from 1900 to current year
  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse()

  // Month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Update calendar view when date changes externally
  useEffect(() => {
    if (selected) {
      setCalendarDate(selected)
    }
  }, [selected])

  const handleMonthChange = (value: string) => {
    const monthIndex = months.findIndex((month) => month === value)
    if (monthIndex !== -1) {
      setCalendarDate(setMonth(calendarDate, monthIndex))
    }
  }

  const handleYearChange = (value: string) => {
    setCalendarDate(setYear(calendarDate, Number.parseInt(value)))
  }

  const handlePrevMonth = () => {
    setCalendarDate(subMonths(calendarDate, 1))
  }

  const handleNextMonth = () => {
    setCalendarDate(addMonths(calendarDate, 1))
  }

  return (
    <Popover>
      <PopoverTrigger disabled={disabled} asChild>
        <Button
          variant="outline"
          className={cn("justify-start w-full text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          {selected ? format(selected, "PPP") : "Select a date"}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 bg-background">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <div className="flex-1 flex space-x-2">
              <Select value={months[getMonth(calendarDate)]} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={getYear(calendarDate).toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(newDate) => {
            onSelect(newDate)
          }}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          fromYear={1900}
          toYear={new Date().getFullYear()}
          initialFocus
          className="rounded-md border-none p-3 bg-background"
        />
      </PopoverContent>
    </Popover>
  )
}
