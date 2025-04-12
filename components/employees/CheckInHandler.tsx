"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Calendar, CheckCircle, Clock, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { endOfDay, format, startOfDay } from "date-fns"
import { getEmployeeAttendance, updateAttendance, type UpdateAttendanceParams } from "@/lib/actions/employee"
import type { AttendanceDetailEntry } from "@/types/employee"
import { useRouter } from "next/navigation"
import { CHECK_IN_LAT, CHECK_IN_LNG, CHECK_IN_RADIUS } from "@/env"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // metres
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
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
  const [attendanceData, setAttendanceData] = useState<AttendanceDetailEntry[] | null>(null)

  const checkLocationPermission = useCallback(async () => {
    console.log("Checking location permission")
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.")
      toast.error("Geolocation is not supported by this browser.")
      return
    }

    const permissionStatus = await navigator.permissions.query({ name: "geolocation" })
    setHasLocationPermission(permissionStatus.state === "granted")
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
  }, [])

  const getLocation = useCallback(() => {
    console.log("Attempting to get location")
    if (!hasLocationPermission) {
      console.log("Location permission not granted")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location retrieved successfully", { position })
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
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    setIsLoading(true)
    try {
      const today = new Date()
      const startDate = startOfDay(today)
      const endDate = endOfDay(today)

      const result = await getEmployeeAttendance(employeeId, startDate, endDate)

      if (result?.status === "SUCCESS" && result.data && result.data.length > 0) {
        setAttendanceId(result.data[0].attendanceId)
        setAttendanceData(result.data)
        console.log("Attendance data fetched:", JSON.stringify(result.data))
      } else {
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
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        CHECK_IN_LAT,
        CHECK_IN_LNG,
      )
      setIsWithinRadius(distance <= CHECK_IN_RADIUS)
      console.log("Distance to check-in location:", distance, "meters")
    }
  }, [userCoordinates])

  useEffect(() => {
    if (employeeId) {
      fetchAttendanceId()
    }
  }, [employeeId, fetchAttendanceId])

  const handleCheckIn = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    if (!attendanceId) {
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.")
      return
    }

    setIsCheckingIn(true)
    try {
      const now = new Date()
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceId,
        isPresent: true,
        clockInTime: now,
        isLeave: false,
      }

      console.log("Calling updateAttendance with params:", params)
      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!")
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
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    if (!attendanceId) {
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

      console.log("Calling updateAttendance with params:", params)
      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted successfully!")
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
              <p className="text-xs text-muted-foreground">Please be within 150 meters of the designated location.</p>
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

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={
                    isLoading ||
                    isCheckingIn ||
                    (attendanceId &&
                      attendanceData?.length > 0 &&
                      attendanceData[0].isPresent &&
                      !attendanceData[0].isLeave)
                  }
                  aria-disabled={isLoading || isCheckingIn}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Checking In...
                    </>
                  ) : attendanceId &&
                    attendanceData?.length > 0 &&
                    attendanceData[0].isPresent &&
                    !attendanceData[0].isLeave ? (
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
                    (attendanceId && attendanceData?.length > 0 && attendanceData[0].isLeave)
                  }
                  aria-disabled={isLoading || isTakingLeave}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {isTakingLeave ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Submitting Leave...
                    </>
                  ) : attendanceId && attendanceData?.length > 0 && attendanceData[0].isLeave ? (
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
          {attendanceId && attendanceData && attendanceData.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-base mb-2">Today's Attendance Status</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-3 border rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {attendanceData[0].isHoliday ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      Holiday
                    </Badge>
                  ) : attendanceData[0].isLeave ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-normal",
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                      )}
                    >
                      On Leave
                    </Badge>
                  ) : attendanceData[0].isPresent ? (
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
                    {attendanceData[0].clockInTime
                      ? attendanceData[0].clockInTime
                      : "Not checked in"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm">{format(new Date(attendanceData[0].date), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attendance ID</p>
                  <p className="text-sm font-mono text-ellipsis overflow-hidden">
                    {attendanceData[0].attendanceId.substring(0, 12)}...
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
