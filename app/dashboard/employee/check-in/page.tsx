"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, AlertTriangle, Loader2, Copy, MapPin, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { startOfDay, endOfDay, format } from "date-fns"
import { getEmployeeAttendance, updateAttendance, type UpdateAttendanceParams } from "@/lib/actions/employee"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { CHECK_IN_LAT, CHECK_IN_LNG } from "@/env"

// Default check-in radius in meters if not specified in env
const DEFAULT_CHECK_IN_RADIUS = 150
const CHECK_IN_RADIUS =
  typeof process.env.CHECK_IN_RADIUS === "string"
    ? Number.parseInt(process.env.CHECK_IN_RADIUS, 10)
    : DEFAULT_CHECK_IN_RADIUS

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  console.log("Calculating distance between", { lat1, lon1, lat2, lon2 })
  const R = 6371e3 // metres
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c
  return distance
}

// Helper function to truncate ID for display
function truncateId(id: string, length = 12) {
  if (!id) return ""
  if (id.length <= length) return id
  return `${id.substring(0, length)}...`
}

export default function EmployeeCheckInPage() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isWithinRadius, setIsWithinRadius] = useState(false)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isTakingLeave, setIsTakingLeave] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const employeeId = session?.user?.id

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
      toast.error("Failed to check location permission. Please try again.")
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

  const fetchAttendanceData = useCallback(async () => {
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
        setAttendanceData(result.data[0])
        console.log("Attendance data fetched:", result.data[0])
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
      fetchAttendanceData()
    }
  }, [employeeId, fetchAttendanceData])

  const handleCheckIn = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    if (!attendanceData?.attendanceId) {
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.")
      return
    }

    setIsCheckingIn(true)
    try {
      const now = new Date()
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceData.attendanceId,
        isPresent: true,
        clockInTime: now,
        isLeave: false,
      }

      console.log("Calling updateAttendance with params:", params)

      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!")
        fetchAttendanceData() // Refresh attendance data
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

    if (!attendanceData?.attendanceId) {
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.")
      return
    }

    setIsTakingLeave(true)
    try {
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceData.attendanceId,
        isPresent: false,
        isLeave: true,
      }

      console.log("Calling updateAttendance with params:", params)

      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted successfully!")
        fetchAttendanceData() // Refresh attendance data
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  // Determine attendance status
  const getAttendanceStatus = () => {
    if (!attendanceData) return null

    if (attendanceData.isHoliday) return { label: "Holiday", variant: "secondary" as const }
    if (attendanceData.isLeave) return { label: "On Leave", variant: "outline" as const }
    if (attendanceData.isPresent) return { label: "Present", variant: "default" as const }
    return { label: "Absent", variant: "destructive" as const }
  }

  const attendanceStatus = getAttendanceStatus()

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 md:py-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl">Employee Check-In</CardTitle>
          <CardDescription>Mark your attendance for today.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Attendance ID Section */}
          {attendanceData?.attendanceId && (
            <div className="p-4 rounded-lg bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="font-medium text-base">Attendance ID:</div>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                <code className="bg-background px-2 py-1 rounded text-sm font-mono break-all">
                  {attendanceData.attendanceId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(attendanceData.attendanceId)}
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
            </div>
          )}

          {/* Location Status Section */}
          <div className="p-6 rounded-lg bg-muted/30 flex flex-col items-center justify-center text-center">
            {!hasLocationPermission ? (
              <div className="space-y-4">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Location Permission Required</h3>
                  <p className="text-muted-foreground mb-4">We need your location to verify your presence.</p>
                  <Button onClick={checkLocationPermission}>Grant Permission</Button>
                </div>
              </div>
            ) : !userCoordinates ? (
              <div className="space-y-4">
                <Clock className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Getting Your Location</h3>
                  <p className="text-muted-foreground">Please wait while we determine your position...</p>
                </div>
              </div>
            ) : !isWithinRadius ? (
              <div className="space-y-4">
                <MapPin className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Outside Check-in Area</h3>
                  <p className="text-muted-foreground">
                    You must be within {CHECK_IN_RADIUS} meters of the designated location to check in.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Check In</h3>
                  <p className="text-muted-foreground mb-4">You're in the right location. You can now check in.</p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      onClick={handleCheckIn}
                      disabled={isLoading || isCheckingIn || attendanceData?.isPresent || attendanceData?.isLeave}
                      className="w-full sm:w-auto"
                    >
                      {isCheckingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking In...
                        </>
                      ) : attendanceData?.isPresent ? (
                        "Already Checked In"
                      ) : attendanceData?.isLeave ? (
                        "On Leave Today"
                      ) : (
                        "Check In"
                      )}
                    </Button>

                    <Button
                      onClick={handleTakeLeave}
                      disabled={isLoading || isTakingLeave || attendanceData?.isPresent || attendanceData?.isLeave}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {isTakingLeave ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Leave...
                        </>
                      ) : attendanceData?.isLeave ? (
                        "Leave Already Submitted"
                      ) : attendanceData?.isPresent ? (
                        "Already Checked In"
                      ) : (
                        "Take a Leave"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Attendance Status */}
          {attendanceData && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Today's Attendance Status</h3>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  {attendanceStatus && (
                    <Badge variant={attendanceStatus.variant} className="text-sm px-3 py-1">
                      {attendanceStatus.label}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Clock In Time</div>
                  <div className="font-medium">
                    {attendanceData.clockInTime
                      ? attendanceData.clockInTime
                      : "Not checked in"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{format(new Date(attendanceData.date), "MMMM do, yyyy")}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Attendance ID</div>
                  <div className="font-medium font-mono text-sm truncate">
                    {truncateId(attendanceData.attendanceId, 12)}
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
