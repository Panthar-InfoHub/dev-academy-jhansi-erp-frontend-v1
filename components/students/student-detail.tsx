"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { completeStudentDetails } from "@/types/student"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Copy, UserPlus } from "lucide-react"
import { BACKEND_SERVER_URL } from "@/env"
import { deleteStudent } from "@/lib/actions/student"
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

interface StudentDetailProps {
  student: completeStudentDetails
}

export function StudentDetail({ student }: StudentDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isDeleting, setIsDeleting] = useState(false)

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/student/${student.id}/profileImg`

  const handleDeleteStudent = async () => {
    setIsDeleting(true)

    toast.promise(deleteStudent(student.id, false), {
      loading: "Deleting student...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push("/dashboard/students")
          return "Student deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete student")
        }
      },
      error: (error) => {
        console.error("Error deleting student:", error)
        return "An error occurred while deleting student"
      },
      finally: () => {
        setIsDeleting(false)
      },
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Student ID copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the student and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src={profileImageUrl} alt={student.name} />
            <AvatarFallback className="text-2xl md:text-3xl">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={student.isActive ? "default" : "outline"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">ID: {student.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(student.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium text-right">
                    {format(new Date(student.dateOfBirth), "MMMM do, yyyy")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right">{student.address || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Father's Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-right">{student.fatherName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{student.fatherPhone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mother's Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-right">{student.motherName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{student.motherPhone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Identification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {student.ids && student.ids.length > 0 ? (
                  <div className="space-y-2">
                    {student.ids.map((id, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">{id.idDocName}</span>
                        <span className="font-medium text-right">{id.idDocValue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No identification documents provided</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {student.studentEnrollments && student.studentEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {student.studentEnrollments.map((enrollment, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium">
                            {enrollment.classRoom?.name} - {enrollment.classSection?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(enrollment.sessionStart), "MMM yyyy")} to{" "}
                            {format(new Date(enrollment.sessionEnd), "MMM yyyy")}
                          </p>
                        </div>
                        <Badge variant={enrollment.isActive ? "default" : "outline"}>
                          {enrollment.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <span className="text-muted-foreground">Monthly Fee</span>
                        <span className="font-medium text-right">₹{enrollment.monthlyFee}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">One-time Fee</span>
                        <span className="font-medium text-right">₹{enrollment.one_time_fee || 0}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium text-right">
                          {enrollment.isComplete ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          View Enrollment Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No enrollments found for this student</p>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Enrollment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
