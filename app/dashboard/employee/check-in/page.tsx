"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { getEmployeeAttendance, updateAttendance, UpdateAttendanceParams } from "@/lib/actions/employee";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {CHECK_IN_LAT, CHECK_IN_LNG, CHECK_IN_RADIUS} from "@/env";


function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

export default function EmployeeCheckInPage() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isTakingLeave, setIsTakingLeave] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const employeeId = session?.user?.id;

  const checkLocationPermission = useCallback(async () => {
    console.log("Checking location permission");
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    setHasLocationPermission(permissionStatus.state === 'granted');
    if (permissionStatus.state === 'granted') {
      console.log("Location permission already granted");
      getLocation();
    } else if (permissionStatus.state === 'prompt') {
      console.log("Requesting location permission");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location permission granted");
          setHasLocationPermission(true);
          setUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Location permission required to check in.");
          setHasLocationPermission(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.log("Location permission denied");
      setHasLocationPermission(false);
      toast.error("Location permission required to check in.");
    }
  }, []);

  const getLocation = useCallback(() => {
    console.log("Attempting to get location");
    if (!hasLocationPermission) {
      console.log("Location permission not granted");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location retrieved successfully", {position});
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [hasLocationPermission]);

  const fetchAttendanceId = useCallback(async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.");
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const startDate = startOfDay(today);
      const endDate = endOfDay(today);

      const result = await getEmployeeAttendance(employeeId, startDate, endDate);

      if (result?.status === "SUCCESS" && result.data && result.data.length > 0) {
        setAttendanceId(result.data[0].attendanceId);
        console.log("Attendance ID fetched:", result.data[0].attendanceId);
      } else {
        toast.error("Attendance details not found. Please wait for system to sync or contact administrator.");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  useEffect(() => {
    if (userCoordinates && CHECK_IN_LAT && CHECK_IN_LNG) {
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        CHECK_IN_LAT,
        CHECK_IN_LNG
      );
      setIsWithinRadius(distance <= CHECK_IN_RADIUS);
      console.log("Distance to check-in location:", distance, "meters");
    }
  }, [userCoordinates]);

  useEffect(() => {
    if (employeeId) {
      fetchAttendanceId();
    }
  }, [employeeId, fetchAttendanceId]);

  const handleCheckIn = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.");
      return;
    }

    if (!attendanceId) {
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.");
      return;
    }

    setIsCheckingIn(true);
    try {
      const now = new Date();
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceId,
        isPresent: true,
        clockInTime: now,
        isLeave: false,
      };

      // Log the parameters being sent to the action
      console.log("Calling updateAttendance with params:", params);

      // Call the updateAttendance action
      // Assuming updateAttendance is correctly set up as a server action
      // and handles the parameters as expected
      // Await the result of the action
      const result = await updateAttendance(params);

      if (result?.status === "SUCCESS") {
        toast.success("Checked in successfully!");
        // Optionally, refresh the attendance data or redirect
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to check in. Please try again.");
      }
    } catch (error) {
      console.error("Failed to check in:", error);
      toast.error("Failed to check in. Please try again.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleTakeLeave = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please contact administrator.");
      return;
    }

    if (!attendanceId) {
      toast.error("Attendance ID not found. Please wait for system to sync or contact administrator.");
      return;
    }

    setIsTakingLeave(true);
    try {
      const params: UpdateAttendanceParams = {
        employeeId: employeeId,
        attendanceId: attendanceId,
        isPresent: false,
        isLeave: true,
      };

      // Log the parameters being sent to the action
      console.log("Calling updateAttendance with params:", params);

      // Call the updateAttendance action
      // Assuming updateAttendance is correctly set up as a server action
      // and handles the parameters as expected
      // Await the result of the action
      const result = await updateAttendance(params);

      if (result?.status === "SUCCESS") {
        toast.success("Leave request submitted successfully!");
        // Optionally, refresh the attendance data or redirect
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to submit leave request. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      toast.error("Failed to submit leave request. Please try again.");
    } finally {
      setIsTakingLeave(false);
    }
  };

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
                  aria-disabled={isLoading || isCheckingIn}
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
                  aria-disabled={isLoading || isTakingLeave}
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
  );
}