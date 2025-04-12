"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDailyAttendance } from "@/lib/actions/employee"
import { generateDailyAttendanceEntries } from "@/lib/actions/admin"
import type { AttendanceDetailEntry } from "@/types/employee.d"
import { toast } from "sonner"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit2Icon, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"
import { EditAttendanceDialog } from "@/components/employees/edit-attendance-dialog";

export function AttendanceReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceDetailEntry[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceDetailEntry | null>(null)

  const fetchAttendance = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true)
      try {
        const result = await getDailyAttendance(selectedDate)

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
          toast.success("Attendance data loaded successfully")
        } else {
          toast.error(result?.message || "Failed to fetch attendance data")
          setAttendanceData([])
        }
      } catch (error) {
        toast.error("An error occurred while fetching attendance data")
        console.error(error)
        setAttendanceData([])
      } finally {
        setIsLoading(false)
      }
    },
    [selectedDate],
  )

  const generateAttendance = async () => {
    setIsGenerating(true)
    try {
      const result = await generateDailyAttendanceEntries()

      if (result?.status === "SUCCESS") {
        toast.success("Attendance entries generated successfully")
        fetchAttendance()
      } else {
        toast.error(result?.message || "Failed to generate attendance entries")
      }
    } catch (error) {
      toast.error("An error occurred while generating attendance entries")
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Select Date</p>
                <EnhancedCalendar selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <Button variant="outline" onClick={() => fetchAttendance(true)} disabled={isLoading}>
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
                  <TableHead>Edit</TableHead>
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
                        {attendance.clockInTime ? attendance.clockInTime : "N/A"}
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
                              "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-200",
                          )}
                        >
                          {attendance.isLeave ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            setSelectedAttendance(attendance)
                            setEditDialogOpen(true)
                          }}
                          variant={"outline"}>
                          <Edit2Icon className={"w-4 h-4"}/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {selectedAttendance &&
          (<EditAttendanceDialog open={editDialogOpen}
                                 onOpenChange={setEditDialogOpen}
                                 attendance={selectedAttendance}
                                 onSuccess={(data) => {
                                   const filteredEntries = attendanceData.filter((a) => {
                                     return a.attendanceId !== data.attendanceId
                                   })
                                   
                                   setAttendanceData((prev) => {
                                     return [...filteredEntries, data]
                                   })
                                   
                                 }}
        />)}
      </Card>
    </div>
  )
}
