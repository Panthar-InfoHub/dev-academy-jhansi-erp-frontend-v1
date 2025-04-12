"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Calendar, CheckCircle, Clock, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { endOfDay, format, isSameDay, startOfDay } from "date-fns"
import { getEmployeeAttendance, updateAttendance, type UpdateAttendanceParams } from "@/lib/actions/employee"
import type { AttendanceDetailEntry } from "@/types/employee"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Declare the variables
const CHECK_IN_LAT = process.env.NEXT_PUBLIC_CHECK_IN_LAT
const CHECK_IN_LNG = process.env.NEXT_PUBLIC_CHECK_IN_LNG
const CHECK_IN_RADIUS = process.env.NEXT_PUBLIC_CHECK_IN_RADIUS

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  console.log("Calculating distance between coordinates:", { lat1, lon1, lat2, lon2 })
  const R = 6371e3 // metres
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c
  console.log("Calculated distance:", distance, "meters")
  return distance
}

export default function CheckInHandler({ employeeId }: { employeeId: string }) {
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isWithinRadius, setIsWithinRadius] = useState(false)
  const [attendanceId, setAttendanceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isTakingLeave, setIsTakingLeave] = useState(false)
  const router = useRouter()
  const [attendanceData, setAttendanceData] = useState<AttendanceDetailEntry | null>(null)
  const [noAttendanceEntry, setNoAttendanceEntry] = useState(false)

  const checkLocationPermission = useCallback(async () => {
    console.log("Checking location permission")
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.")
      toast.error("Geolocation is not supported by this browser.")
      return
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" })
      setHasLocationPermission(permissionStatus.state === "granted")
      console.log("Location permission status:", permissionStatus.state)

      if (permissionStatus.state === "granted") {
        console.log("Location permission already granted")
        getLocation()
      } else if (permissionStatus.state === "prompt") {
        console.log("Requesting location permission")
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Location permission granted")
            setHasLocationPermission(true)
            setUserCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          (error) => {
            console.error("Error getting location:", error)
            toast.error("Location permission required to check in.")
            setHasLocationPermission(false)
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        )
      } else {
        console.log("Location permission denied")
        setHasLocationPermission(false)
        toast.error("Location permission required to check in.")
      }
    } catch (error) {
      console.error("Error checking location permission:", error)
      toast.error("Failed to check location permission.")
    }
  }, [])

  const getLocation = useCallback(() => {
    console.log("Attempting to get location")
    if (!hasLocationPermission) {
      console.log("Location permission not granted")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location retrieved successfully", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Failed to get location. Please try again.")
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    )
  }, [hasLocationPermission])

  const fetchAttendanceId = useCallback(async () => {
    if (!employeeId) {
      console.log("Employee ID not found")
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    setIsLoading(true)
    setNoAttendanceEntry(false)

    try {
      console.log("Fetching attendance for employee:", employeeId)
      const today = new Date()
      const startDate = startOfDay(today)
      const endDate = endOfDay(today)

      console.log("Date range for attendance query:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const result = await getEmployeeAttendance(employeeId, startDate, endDate)
      console.log("Attendance query result:", JSON.stringify(result))

      if (result?.status === "SUCCESS" && result.data && result.data.length > 0) {
        console.log("Processing attendance data:", JSON.stringify(result.data))

        // Find today's attendance entry
        const todayAttendance = result.data.find((attendance) => isSameDay(new Date(attendance.date), today))

        if (todayAttendance) {
          console.log("Found today's attendance:", JSON.stringify(todayAttendance))
          console.log("Is today a holiday?", todayAttendance.isHoliday)
          setAttendanceId(todayAttendance.attendanceId)
          setAttendanceData(todayAttendance)
        } else {
          console.log("No attendance entry found for today")
          setNoAttendanceEntry(true)
          toast.error("No attendance entry found for today. Please contact administrator.")
        }
      } else {
        console.log("No attendance data returned or error in response")
        setNoAttendanceEntry(true)
        toast.error("Attendance details not found. Please wait for system to sync or contact administrator.")
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      toast.error("Failed to fetch attendance details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    checkLocationPermission()
  }, [checkLocationPermission])

  useEffect(() => {
    if (userCoordinates && CHECK_IN_LAT && CHECK_IN_LNG) {
      const checkInLat = Number.parseFloat(CHECK_IN_LAT)
      const checkInLng = Number.parseFloat(CHECK_IN_LNG)
      const checkInRadius = Number.parseFloat(CHECK_IN_RADIUS || "150")

      console.log("Check-in location config:", {
        CHECK_IN_LAT: checkInLat,
        CHECK_IN_LNG: checkInLng,
        CHECK_IN_RADIUS: checkInRadius,
      })

      const distance = calculateDistance(userCoordinates.latitude, userCoordinates.longitude, checkInLat, checkInLng)

      const withinRadius = distance <= checkInRadius
      console.log("Is within radius:", withinRadius, "Distance:", distance, "meters", "Allowed radius:", checkInRadius)
      setIsWithinRadius(withinRadius)
    }
  }, [userCoordinates])

  useEffect(() => {
    if (employeeId) {
      fetchAttendanceId()
    }
  }, [employeeId, fetchAttendanceId])

  const handleCheckIn = async () => {
    if (!employeeId) {
      console.log("Employee ID not found")
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    if (!attendanceId) {
      console.log("Attendance ID not found")
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.")
      return
    }

    setIsCheckingIn(true)
    try {
      const now = new Date()
      console.log("Check-in time:", now.toISOString())

      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceId,
        isPresent: true,
        clockInTime: now,
        isLeave: false,
      }

      console.log("Calling updateAttendance with params:", JSON.stringify(params))
      const result = await updateAttendance(params)
      console.log("Update attendance result:", JSON.stringify(result))

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!")
        // Refresh attendance data
        await fetchAttendanceId()
        router.refresh()
      } else {
        toast.error(result?.message || "Failed to check in. Please try again.")
      }
    } catch (error) {
      console.error("Failed to check in:", error)
      toast.error("Failed to check in. Please try again.")
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleTakeLeave = async () => {
    if (!employeeId) {
      console.log("Employee ID not found")
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    if (!attendanceId) {
      console.log("Attendance ID not found")
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.")
      return
    }

    setIsTakingLeave(true)
    try {
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceId,
        isPresent: false,
        isLeave: true,
      }

      console.log("Calling updateAttendance with params:", JSON.stringify(params))
      const result = await updateAttendance(params)
      console.log("Update attendance result:", JSON.stringify(result))

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted successfully!")
        // Refresh attendance data
        await fetchAttendanceId()
        router.refresh()
      } else {
        toast.error(result?.message || "Failed to submit leave request. Please try again.")
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error)
      toast.error("Failed to submit leave request. Please try again.")
    } finally {
      setIsTakingLeave(false)
    }
  }

  return (
    <div className="px-2 py-4 sm:px-4 md:px-6">
      <Card className="shadow-md border-0">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xl md:text-2xl">Employee Check-In</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Mark your attendance for today.</p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {/* No Attendance Entry Message */}
          {noAttendanceEntry && (
            <div className="text-center p-4 border rounded-md bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-medium mb-1.5">Attendance Not Available</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                The system has not created an attendance entry for today. Please check back later or contact an
                administrator.
              </p>
              <Button onClick={fetchAttendanceId} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          )}

          {/* Attendance ID Section */}
          {attendanceId && (
            <div className="p-3 border rounded-md bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm font-medium">Attendance ID:</div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="bg-background rounded px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis max-w-[200px]">
                    {attendanceId}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(attendanceId)
                      toast.success("Attendance ID copied")
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Location Permission Section */}
          {!hasLocationPermission ? (
            <div className="text-center p-4 border rounded-md bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-medium mb-1.5">Location Permission Required</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                We need your location to verify your presence at the check-in point.
              </p>
              <Button onClick={checkLocationPermission} size="sm">
                Grant Permission
              </Button>
            </div>
          ) : !userCoordinates ? (
            <div className="text-center p-4 border rounded-md">
              <Clock className="h-10 w-10 text-amber-500 mx-auto mb-2 animate-pulse" />
              <h3 className="text-lg font-medium mb-1.5">Getting Your Location</h3>
              <p className="text-sm text-muted-foreground">Please wait while we determine your position...</p>
            </div>
          ) : !isWithinRadius ? (
            <div className="text-center p-4 border rounded-md bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <h3 className="text-base font-medium mb-1.5">Outside Check-in Area</h3>
              <p className="mb-1 text-sm">You are not within the allowed check-in radius.</p>
              <p className="text-xs text-muted-foreground">
                Please be within {CHECK_IN_RADIUS || 150} meters of the designated location.
              </p>
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-green-50 dark:bg-green-950/20">
              <div className="text-center mb-3">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-base font-medium mb-1">Ready to Check In</h3>
                <p className="text-sm text-muted-foreground">
                  You're at the right location. Mark your attendance below.
                </p>
              </div>

              {attendanceData?.isHoliday && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-center">
                  <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today is marked as a holiday.</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Check-in and leave requests are disabled on holidays.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={
                    isLoading ||
                    isCheckingIn ||
                    noAttendanceEntry ||
                    (attendanceData?.isPresent && !attendanceData?.isLeave) ||
                    attendanceData?.isHoliday
                  }
                  aria-disabled={isLoading || isCheckingIn || noAttendanceEntry || attendanceData?.isHoliday}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Checking In...
                    </>
                  ) : attendanceData?.isHoliday ? (
                    <>
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Holiday
                    </>
                  ) : attendanceData?.isPresent && !attendanceData?.isLeave ? (
                    <>
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Already Checked In
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      Check In
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleTakeLeave}
                  disabled={
                    isLoading ||
                    isTakingLeave ||
                    noAttendanceEntry ||
                    attendanceData?.isLeave ||
                    attendanceData?.isHoliday
                  }
                  aria-disabled={isLoading || isTakingLeave || noAttendanceEntry || attendanceData?.isHoliday}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isTakingLeave ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Submitting Leave...
                    </>
                  ) : attendanceData?.isHoliday ? (
                    <>
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Holiday
                    </>
                  ) : attendanceData?.isLeave ? (
                    <>
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Leave Submitted
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Take Leave
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Attendance Status Section */}
          {attendanceId && attendanceData && (
            <div className="mt-4">
              <h3 className="font-medium text-base mb-2">Today's Attendance Status</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-3 border rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {attendanceData.isHoliday ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      Holiday
                    </Badge>
                  ) : attendanceData.isLeave ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-normal",
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                      )}
                    >
                      On Leave
                    </Badge>
                  ) : attendanceData.isPresent ? (
                    <Badge className="bg-green-500 text-xs font-normal">Present</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs font-normal">
                      Absent
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clock In Time</p>
                  <p className="text-sm">
                    {attendanceData.clockInTime ? attendanceData.clockInTime : "Not checked in"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm">{format(new Date(attendanceData.date), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attendance ID</p>
                  <p className="text-sm font-mono text-ellipsis overflow-hidden">
                    {attendanceData.attendanceId.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
