"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { getDailyAttendance } from "@/lib/actions/employee"
import { generateDailyAttendanceEntries } from "@/lib/actions/admin"
import type { AttendanceDetailEntry } from "@/types/employee.d"
import { toast } from "sonner"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function AttendanceReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceDetailEntry[]>([])

  const fetchAttendance = async () => {
    setIsLoading(true)

    toast.promise(getDailyAttendance(selectedDate), {
      loading: "Loading attendance data...",
      success: (result) => {
        if (result?.status === "SUCCESS" && result.data) {
          // Check if the data is in the expected format
          if (result.data.attendanceData) {
            setAttendanceData(result.data.attendanceData || [])
          } else if (result.data.attendance) {
            setAttendanceData(result.data.attendance || [])
          } else {
            console.error("Unexpected data format:", result.data)
            setAttendanceData([])
          }
          return "Attendance data loaded successfully"
        } else {
          throw new Error(result?.message || "Failed to fetch attendance data")
        }
      },
      error: (error) => {
        console.error("Error fetching attendance:", error)
        setAttendanceData([])
        return "Failed to load attendance data"
      },
      finally: () => {
        setIsLoading(false)
      },
    })
  }

  const generateAttendance = async () => {
    setIsGenerating(true)

    toast.promise(generateDailyAttendanceEntries(), {
      loading: "Generating attendance entries...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchAttendance()
          return "Attendance entries generated successfully"
        } else {
          throw new Error(result?.message || "Failed to generate attendance entries")
        }
      },
      error: (error) => {
        console.error("Error generating attendance entries:", error)
        return "Failed to generate attendance entries"
      },
      finally: () => {
        setIsGenerating(false)
      },
    })
  }

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAttendance} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={generateAttendance} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Entries"
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Clock In Time</TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Leave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : attendanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No attendance records found for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceData.map((attendance) => (
                    <TableRow key={attendance.attendanceId}>
                      <TableCell>{attendance.employeeId}</TableCell>
                      <TableCell>{attendance.employee?.name || "Unknown"}</TableCell>
                      <TableCell>
                        {typeof attendance.date === "string"
                          ? format(new Date(attendance.date), "PPP")
                          : format(attendance.date, "PPP")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={attendance.isPresent ? "default" : "destructive"}>
                          {attendance.isPresent ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attendance.clockInTime ? format(new Date(attendance.clockInTime), "h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={attendance.isHoliday ? "secondary" : "outline"}>
                          {attendance.isHoliday ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            attendance.isLeave &&
                              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          )}
                        >
                          {attendance.isLeave ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
