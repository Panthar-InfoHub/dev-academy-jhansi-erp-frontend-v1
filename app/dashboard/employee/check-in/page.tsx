"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Clock, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startOfDay, endOfDay } from "date-fns"
import {
  getEmployeeAttendance,
  updateAttendance,
  type UpdateAttendanceParams,
} from "@/lib/actions/employee"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  CHECK_IN_LAT,
  CHECK_IN_LNG,
  CHECK_IN_RADIUS,
} from "@/env"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default function EmployeeCheckInPage() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isWithinRadius, setIsWithinRadius] = useState(false)
  const [attendanceId, setAttendanceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isTakingLeave, setIsTakingLeave] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const employeeId = session?.user?.id

  const getLocation = () => {
    if (!hasLocationPermission) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Got location:", position)
        alert("Got location!")
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
  }

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.")
      return
    }

    const permissionStatus = await navigator.permissions.query({ name: "geolocation" })

    setHasLocationPermission(permissionStatus.state === "granted")

    if (permissionStatus.state === "denied") {
      toast.error("Permission denied. Location permission required to check in.")
      return
    }

    if (permissionStatus.state === "granted") {
      getLocation()
    } else if (permissionStatus.state === "prompt") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
    }
  }

  const fetchAttendanceId = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.")
      return
    }

    setIsLoading(true)
    try {
      const today = new Date()
      const result = await getEmployeeAttendance(employeeId, startOfDay(today), endOfDay(today))

      if (result?.status === "SUCCESS" && result.data?.length > 0) {
        setAttendanceId(result.data[0].attendanceId)
      } else {
        toast.error("Attendance details not found. Please wait or contact admin.")
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      toast.error("Failed to fetch attendance. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkLocationPermission()
  }, [])

  useEffect(() => {
    if (userCoordinates && CHECK_IN_LAT && CHECK_IN_LNG) {
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        CHECK_IN_LAT,
        CHECK_IN_LNG,
      )
      setIsWithinRadius(distance <= CHECK_IN_RADIUS)
    }
  }, [userCoordinates])

  useEffect(() => {
    if (employeeId) {
      fetchAttendanceId()
    }
  }, [employeeId])

  const handleCheckIn = async () => {
    if (!employeeId || !attendanceId) {
      toast.error("Missing employee or attendance ID.")
      return
    }

    setIsCheckingIn(true)
    try {
      const now = new Date()
      const params: UpdateAttendanceParams = {
        employeeId,
        attendanceId,
        isPresent: true,
        clockInTime: now,
        isLeave: false,
      }

      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!")
        router.refresh()
      } else {
        toast.error(result?.message || "Failed to check in.")
      }
    } catch (error) {
      console.error("Failed to check in:", error)
      toast.error("Failed to check in. Please try again.")
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleTakeLeave = async () => {
    if (!employeeId || !attendanceId) {
      toast.error("Missing employee or attendance ID.")
      return
    }

    setIsTakingLeave(true)
    try {
      const params: UpdateAttendanceParams = {
        employeeId,
        attendanceId,
        isPresent: false,
        isLeave: true,
      }

      const result = await updateAttendance(params)

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted!")
        router.refresh()
      } else {
        toast.error(result?.message || "Failed to submit leave.")
      }
    } catch (error) {
      console.error("Failed to submit leave:", error)
      toast.error("Failed to submit leave. Please try again.")
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
        <CardContent className="space-y-4">
          {!hasLocationPermission ? (
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 inline-block mr-2" />
              <p>Location permission is required to check in.</p>
              <Button onClick={checkLocationPermission}>Grant Permission</Button>
            </div>
          ) : !userCoordinates ? (
            <div className="text-center">
              <Clock className="h-6 w-6 inline-block mr-2" />
              <p>Getting your location...</p>
            </div>
          ) : !isWithinRadius ? (
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 inline-block mr-2" />
              <p>You are not within the allowed check-in radius.</p>
              <p>Please be within 150 meters of the designated location.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={isLoading || isCheckingIn}
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    "Check-In"
                  )}
                </Button>
                <Button
                  onClick={handleTakeLeave}
                  disabled={isLoading || isTakingLeave}
                >
                  {isTakingLeave ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Leave...
                    </>
                  ) : (
                    "Take a Leave"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
