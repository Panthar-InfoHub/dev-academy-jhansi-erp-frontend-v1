"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Calendar, CheckCircle, Clock, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { endOfDay, format, startOfDay } from "date-fns"
import { getEmployeeAttendance, updateAttendance, type UpdateAttendanceParams, } from "@/lib/actions/employee"
import { AttendanceDetailEntry } from "@/types/employee";
import { useRouter } from "next/navigation"
import { CHECK_IN_LAT, CHECK_IN_LNG, CHECK_IN_RADIUS } from "@/env"
import { Badge } from "@/components/ui/badge"

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

export default function CheckInHandler({employeeId}: {employeeId: string}) {
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
      console.log("Location permission already granted")
      getLocation()
    } else if (permissionStatus.state === "prompt") {
      console.log("Requesting location permission")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted")
          console.log("Location permission granted")
          setHasLocationPermission(true)
          setUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          console.error("Error getting location:", error)
          toast.error("Location permission required to check in.")
          setHasLocationPermission(false)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      )
    } else {
      console.log("Location permission denied")
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

      // Log the parameters being sent to the action
      console.log("Calling updateAttendance with params:", params)

      // Call the updateAttendance action
      // Assuming updateAttendance is correctly set up as a server action
      // and handles the parameters as expected
      // Await the result of the action
      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!")
        // Optionally, refresh the attendance data or redirect
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

      // Log the parameters being sent to the action
      console.log("Calling updateAttendance with params:", params)

      // Call the updateAttendance action
      // Assuming updateAttendance is correctly set up as a server action
      // and handles the parameters as expected
      // Await the result of the action
      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted successfully!")
        // Optionally, refresh the attendance data or redirect
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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Check-In</CardTitle>
          <CardDescription>Mark your attendance for today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Attendance ID Section */}
          {attendanceId && (
            <div className="p-4 border rounded-md bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Attendance ID:</h3>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-background rounded text-sm">{attendanceId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(attendanceId)
                      toast.success("Attendance ID copied to clipboard")
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Location Permission Section */}
          {!hasLocationPermission ? (
            <div className="text-center p-6 border rounded-md bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-2">Location Permission Required</h3>
              <p className="mb-4 text-muted-foreground">
                We need your location to verify your presence at the check-in point.
              </p>
              <Button onClick={checkLocationPermission}>Grant Permission</Button>
            </div>
          ) : !userCoordinates ? (
            <div className="text-center p-6 border rounded-md">
              <Clock className="h-10 w-10 text-primary/60 mx-auto mb-2 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Getting Your Location</h3>
              <p className="text-muted-foreground">Please wait while we determine your position...</p>
            </div>
          ) : !isWithinRadius ? (
            <div className="text-center p-6 border rounded-md bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-2">Outside Check-in Area</h3>
              <p className="mb-1">You are not within the allowed check-in radius.</p>
              <p className="text-sm text-muted-foreground">Please be within 150 meters of the designated location.</p>
            </div>
          ) : (
            <div className="p-6 border rounded-md bg-green-50 dark:bg-green-950/20">
              <div className="text-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-medium">Ready to Check In</h3>
                <p className="text-muted-foreground">You're at the right location. Mark your attendance below.</p>
              </div>

              <div className="flex justify-center gap-4 mt-6">
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
                  className="px-6"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : attendanceId &&
                    attendanceData?.length > 0 &&
                    attendanceData[0].isPresent &&
                    !attendanceData[0].isLeave ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Checked In
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
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
                  className="px-6"
                >
                  {isTakingLeave ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Leave...
                    </>
                  ) : attendanceId && attendanceData?.length > 0 && attendanceData[0].isLeave ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Leave Submitted
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Take Leave
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Attendance Status Section */}
          {attendanceId && attendanceData && attendanceData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Today's Attendance Status</h3>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {attendanceData[0].isHoliday ? (
                      <Badge variant="outline" className="mt-1">
                        Holiday
                      </Badge>
                    ) : attendanceData[0].isLeave ? (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-1">
                        On Leave
                      </Badge>
                    ) : attendanceData[0].isPresent ? (
                      <Badge className="bg-green-500 mt-1">Present</Badge>
                    ) : (
                      <Badge variant="destructive" className="mt-1">
                        Absent
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clock In Time</p>
                  <p className="font-medium">
                    {attendanceData[0].clockInTime
                      ? format(new Date(attendanceData[0].clockInTime), "h:mm a")
                      : "Not checked in"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(attendanceData[0].date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance ID</p>
                  <div className="flex items-center gap-1">
                    <p className="font-medium truncate">{attendanceData[0].attendanceId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
