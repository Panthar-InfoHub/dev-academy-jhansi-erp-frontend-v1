"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { getEmployeeAttendance } from "@/lib/actions/employee"
import { toast } from "sonner"
import { format, subMonths, startOfDay, endOfDay } from "date-fns"
import type { AttendanceDetailEntry } from "@/types/employee"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface ProfileAttendanceProps {
  employeeId: string
}

export function ProfileAttendance({ employeeId }: ProfileAttendanceProps) {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceDetailEntry[]>([])

  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      const result = await getEmployeeAttendance(employeeId, startOfDay(startDate), endOfDay(endDate))

      if (result?.status === "SUCCESS" && result.data) {
        setAttendanceData(result.data.attendanceData || [])
      } else {
        toast.error(result?.message || "Failed to fetch attendance data")
      }
    } catch (error) {
      toast.error("An error occurred while fetching attendance data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [employeeId])

  // Function to determine day color based on attendance
  const getDayColor = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const attendance = attendanceData.find((a) => a.date.split("T")[0] === dateStr)

    if (!attendance) return undefined

    if (attendance.isHoliday) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (attendance.isLeave) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    if (attendance.isPresent) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>View your attendance records for the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2">Start Date</h3>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                disabled={(date) => date > new Date() || date > endDate}
                className="rounded-md border"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2">End Date</h3>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                disabled={(date) => date > new Date() || date < startDate}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd")
                    return attendanceData.some((a) => a.date.split("T")[0] === dateStr && a.isPresent)
                  },
                  holiday: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd")
                    return attendanceData.some((a) => a.date.split("T")[0] === dateStr && a.isHoliday)
                  },
                  leave: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd")
                    return attendanceData.some((a) => a.date.split("T")[0] === dateStr && a.isLeave)
                  },
                  absent: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd")
                    return attendanceData.some(
                      (a) => a.date.split("T")[0] === dateStr && !a.isPresent && !a.isHoliday && !a.isLeave,
                    )
                  },
                }}
                modifiersClassNames={{
                  booked: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  holiday: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  leave: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                }}
              />
            </div>
          </div>

          <Button onClick={fetchAttendance} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Fetch Attendance"
            )}
          </Button>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs">Holiday</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs">Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>Detailed view of your attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Clock In</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((attendance) => (
                    <tr key={attendance.attendanceId} className="border-b">
                      <td className="py-2 px-4">{format(new Date(attendance.date), "PPP")}</td>
                      <td className="py-2 px-4">
                        {attendance.isHoliday ? (
                          <Badge variant="secondary">Holiday</Badge>
                        ) : attendance.isLeave ? (
                          <Badge variant="outline">Leave</Badge>
                        ) : attendance.isPresent ? (
                          <Badge variant="default">Present</Badge>
                        ) : (
                          <Badge variant="destructive">Absent</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {attendance.clockInTime ? format(new Date(attendance.clockInTime), "h:mm a") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No attendance records found for the selected date range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
