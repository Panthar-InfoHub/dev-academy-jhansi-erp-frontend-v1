"use client"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useState } from "react";
import { format, addMonths, subMonths, getYear, getMonth, setMonth, setYear } from "date-fns"
interface EnhancedCalendarProps {
  selected: Date
  onSelect: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function EnhancedCalendar({
  selected,
  onSelect,
  disabled = false,
  className,
  placeholder = "Pick a date",
}: EnhancedCalendarProps) {
  // Add console.log for debugging
  console.log("EnhancedCalendar rendering with date:", selected)
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
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !selected && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 bg-background">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="icon" className="h-7 w-7 mr-2" onClick={handlePrevMonth}>
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
            <Button variant="outline" size="icon" className="h-7 w-7 ml-2" onClick={handleNextMonth}>
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
          captionLayout={"buttons"}
          toYear={new Date().getFullYear()}
          initialFocus
          className={"flex items-center justify-center border-none p-4 bg-background"}
        />
      </PopoverContent>
    </Popover>
  )
}
