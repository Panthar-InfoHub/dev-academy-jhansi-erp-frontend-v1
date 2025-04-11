"use client"

import { useState } from "react"
import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"
import { Copy, Ban, CheckCircle, UserX, UserCheck } from "lucide-react"
import { BACKEND_SERVER_URL } from "@/env"
import { updateEmployee } from "@/lib/actions/employee"
import { useRouter } from "next/navigation"
import { IdManagement } from "@/components/profile/id-management"
import { UploadProfileImage } from "@/components/profile/upload-profile-image"
import { ProfileAttendance } from "@/components/profile/profile-attendance"
import { EditProfileButton } from "@/components/profile/edit-profile-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSession } from "next-auth/react"

interface EmployeeDetailProps {
  employee: completeEmployeeAttributes
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${employee.id}/profileImg`

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(employee.id)
    toast.success("Employee ID copied to clipboard")
  }

  // Check if the employee is the current user
  const isCurrentUser = employee.id === currentUserId

  const handleStatusChange = async (status: { isActive?: boolean; isFired?: boolean }) => {
    if (isCurrentUser) {
      toast.error("You cannot modify your own account status")
      return
    }

    setIsSubmitting(true)

    toast.promise(
      updateEmployee({
        id: employee.id,
        ...status,
      }),
      {
        loading: "Updating employee status...",
        success: (result) => {
          if (result.status === "SUCCESS") {
            // Refresh the page to show updated data
            router.refresh()
            return "Employee status updated successfully"
          } else {
            throw new Error(result.message || "Failed to update employee status")
          }
        },
        error: (error) => {
          console.error("Error updating employee status:", error)
          return "An error occurred while updating employee status"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Employees
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src={profileImageUrl} alt={employee.name} />
            <AvatarFallback className="text-2xl md:text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <UploadProfileImage employeeId={employee.id} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{employee.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{employee.workRole}</Badge>
                {employee.isFired ? (
                  <Badge variant="destructive">Fired</Badge>
                ) : employee.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{employee.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">ID: {employee.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyIdToClipboard}>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <EditProfileButton employee={employee} />

              {employee.isActive ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <Ban className="mr-2 h-4 w-4" />
                      Disable
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to disable this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent the employee from accessing the system. You can re-enable them later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isActive: false })}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Disable
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enable
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to enable this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will allow the employee to access the system again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isActive: true })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Enable
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {employee.isFired ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Reinstate
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to reinstate this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the fired status from the employee and enable their account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isFired: false, isActive: true })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Reinstate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <UserX className="mr-2 h-4 w-4" />
                      Fire
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to fire this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the employee as fired in the system and disable their account. This action can be
                        reversed by an administrator.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isFired: true, isActive: false })}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Fire Employee
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium text-right">
                    {format(new Date(employee.dateOfBirth), "MMMM do, yyyy")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right">{employee.address || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{employee.phone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Family Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Father's Name</span>
                  <span className="font-medium text-right">{employee.fatherName || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Father's Phone</span>
                  <span className="font-medium text-right">{employee.fatherPhone || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Mother's Name</span>
                  <span className="font-medium text-right">{employee.motherName || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Mother's Phone</span>
                  <span className="font-medium text-right">{employee.motherPhone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-right">{employee.workRole}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-medium text-right">₹{employee.salary.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <div className="text-right">
                    {employee.isFired ? (
                      <Badge variant="destructive">Fired</Badge>
                    ) : employee.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="font-medium text-right">{format(new Date(employee.createdAt), "PPP")}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-right">{format(new Date(employee.updatedAt), "PPP")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Identification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <IdManagement employee={employee} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0 space-y-4">
          <ProfileAttendance employeeId={employee.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
