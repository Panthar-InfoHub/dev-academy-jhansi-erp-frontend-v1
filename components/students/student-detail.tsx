"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { completeStudentDetails } from "@/types/student"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  UserPlus,
  CheckCircle,
  Ban,
  Calendar,
  School,
  RefreshCw,
  ExternalLink,
  Receipt,
} from "lucide-react"
import { BACKEND_SERVER_URL } from "@/env"
import { deleteStudent, updateStudentDetails, getStudentPaymentsInfo } from "@/lib/actions/student"
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
import { StudentIdManagement } from "./student-id-management"
import { EditStudentDialog } from "./edit-student-dialog"
import { NewEnrollmentDialog } from "./new-enrollment-dialog"
import { getClassroomDetails, getAllSectionsOfClassroom } from "@/lib/actions/classroom"
import { PaymentReceiptDialog } from "./payment-receipt-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { completeClassDetails } from "@/types/classroom";

interface StudentDetailProps {
  student: completeStudentDetails
}

export function StudentDetail({ student }: StudentDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newEnrollmentDialogOpen, setNewEnrollmentDialogOpen] = useState(false)
  const [studentData, setStudentData] = useState<completeStudentDetails>(student)
  const [payments, setPayments] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsLimit] = useState(10)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [enrollmentDetails, setEnrollmentDetails] = useState<
    Record<string, { className: string; sectionName: string }>
  >({})
  const [isLoadingEnrollmentDetails, setIsLoadingEnrollmentDetails] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)

  const initials = studentData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/student/${studentData.id}/profileImg`

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments()
    }
  }, [activeTab, paymentsPage])

  useEffect(() => {
    if (studentData.studentEnrollments && studentData.studentEnrollments.length > 0) {
      fetchEnrollmentDetails()
    }
  }, [studentData.studentEnrollments])

  const fetchEnrollmentDetails = async () => {
    if (!studentData.studentEnrollments || studentData.studentEnrollments.length === 0) return

    setIsLoadingEnrollmentDetails(true)
    const details: Record<string, { className: string; sectionName: string }> = {}

    try {
      for (const enrollment of studentData.studentEnrollments) {
        if (enrollment.classroomId && enrollment.classroomSectionId) {
          // Fetch class details
          const classDetails = await getClassroomDetails(enrollment.classroomId)

          // Fetch section details
          const sectionDetails = await getAllSectionsOfClassroom(enrollment.classroomId)

          if (classDetails && sectionDetails) {
            const section = sectionDetails.find((s) => s.id === enrollment.classroomSectionId)

            details[enrollment.id] = {
              className: (classDetails as completeClassDetails).name || "Unknown Class",
              sectionName: section?.name || "Unknown Section",
            }
          }
        }
      }

      setEnrollmentDetails(details)
    } catch (error) {
      console.error("Error fetching enrollment details:", error)
    } finally {
      setIsLoadingEnrollmentDetails(false)
    }
  }

  const fetchPayments = async () => {
    setIsLoadingPayments(true)
    try {
      const result = await getStudentPaymentsInfo(studentData.id, paymentsLimit, paymentsPage)
      if (result?.status === "SUCCESS" && result.data) {
        setPayments(result.data.payments || [])
        setTotalPayments(result.data.totalItems || 0)
        setTotalPages(result.data.totalPages || 1)
      } else {
        toast.error(result?.message || "Failed to fetch payment information")
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("An error occurred while fetching payment information")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleDeleteStudent = async () => {
    setIsDeleting(true)

    toast.promise(deleteStudent(studentData.id, false), {
      loading: "Deleting student...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push("/dashboard/students")
          return result.message || "Student deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete student")
        }
      },
      error: (error) => {
        console.error("Error deleting student:", error)
        return error.message || "An error occurred while deleting student"
      },
      finally: () => {
        setIsDeleting(false)
      },
    })
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)

    toast.promise(updateStudentDetails(studentData.id, { isActive: !studentData.isActive }), {
      loading: `${studentData.isActive ? "Disabling" : "Enabling"} student...`,
      success: (result) => {
        if (result?.status === "SUCCESS" && result.data) {
          setStudentData(result.data)
          return result.message || `Student ${studentData.isActive ? "disabled" : "enabled"} successfully`
        } else {
          throw new Error(result?.message || `Failed to ${studentData.isActive ? "disable" : "enable"} student`)
        }
      },
      error: (error) => {
        console.error(`Error ${studentData.isActive ? "disabling" : "enabling"} student:`, error)
        return error.message || `An error occurred while ${studentData.isActive ? "disabling" : "enabling"} student`
      },
      finally: () => {
        setIsTogglingStatus(false)
      },
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Student ID copied to clipboard")
  }

  const handleStudentUpdated = (updatedStudent: completeStudentDetails) => {
    setStudentData(updatedStudent)
    toast.success("Student updated successfully")
  }

  const getEnrollmentName = (enrollment: any) => {
    if (enrollmentDetails[enrollment.id]) {
      return `${enrollmentDetails[enrollment.id].className} - ${enrollmentDetails[enrollment.id].sectionName}`
    }
    return "Loading..."
  }

  const showPaymentReceipt = (payment: any) => {
    setSelectedPayment(payment)
    setReceiptDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/students")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
          <Button variant="outline" onClick={() => setNewEnrollmentDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
          {studentData.isActive ? (
            <Button variant="outline" onClick={handleToggleStatus} disabled={isTogglingStatus}>
              <Ban className="mr-2 h-4 w-4" />
              Disable Student
            </Button>
          ) : (
            <Button variant="outline" onClick={handleToggleStatus} disabled={isTogglingStatus}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Enable Student
            </Button>
          )}
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
            <AvatarImage src={profileImageUrl} alt={studentData.name} />
            <AvatarFallback className="text-2xl md:text-3xl">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{studentData.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={studentData.isActive ? "default" : "outline"}>
                  {studentData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">ID: {studentData.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(studentData.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">ID: {studentData.UDISECode}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(studentData.id)}>
                  <Copy className="h-3.5 w-3.5"/>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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
                    {format(new Date(studentData.dateOfBirth), "MMMM do, yyyy")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right">{studentData.address || "Not provided"}</span>
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
                  <span className="font-medium text-right">{studentData.fatherName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{studentData.fatherPhone || "Not provided"}</span>
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
                  <span className="font-medium text-right">{studentData.motherName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{studentData.motherPhone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Identification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentIdManagement student={studentData} onUpdate={handleStudentUpdated} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Enrollments</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setNewEnrollmentDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Enrollment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentData.studentEnrollments && studentData.studentEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {studentData.studentEnrollments.map((enrollment, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">
                              {isLoadingEnrollmentDetails ? "Loading..." : getEnrollmentName(enrollment)}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Calendar className="inline-block mr-1 h-3.5 w-3.5" />
                            {format(new Date(enrollment.sessionStart), "MMM yyyy")} to{" "}
                            {format(new Date(enrollment.sessionEnd), "MMM yyyy")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={enrollment.isActive ? "default" : "outline"}>
                            {enrollment.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant={enrollment.isComplete ? "default" : "secondary"} className="bg-orange-500">
                            {enrollment.isComplete ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <span className="text-muted-foreground">Monthly Fee</span>
                        <span className="font-medium text-right">₹{enrollment.monthlyFee.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">One-time Fee</span>
                        <span className="font-medium text-right">
                          ₹{(enrollment.one_time_fee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Navigate in the same tab
                            router.push(`/dashboard/student/${studentData.id}/enrollment/${enrollment.id}`)
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Enrollment Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No enrollments found for this student</p>
                  <Button onClick={() => setNewEnrollmentDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New Enrollment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment History</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchPayments} disabled={isLoadingPayments}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPayments ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payments.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-4 text-left border-r">Date</th>
                          <th className="py-2 px-4 text-left border-r">Amount</th>
                          <th className="py-2 px-4 text-left border-r">Original Balance</th>
                          <th className="py-2 px-4 text-left border-r">Remaining Balance</th>
                          <th className="py-2 px-4 text-left border-r">Receipt</th>
                          <th className="py-2 px-4 text-left">Enrollment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4 border-r">{format(new Date(payment.paidOn), "MMM d, yyyy")}</td>
                            <td className="py-2 px-4 border-r">₹{payment.paidAmount.toLocaleString()}</td>
                            <td className="py-2 px-4 border-r">₹{payment.originalBalance.toLocaleString()}</td>
                            <td className="py-2 px-4 border-r">₹{payment.remainingBalance.toLocaleString()}</td>
                            <td className="py-2 px-4 border-r">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => showPaymentReceipt(payment)}
                                      className="flex items-center gap-1"
                                    >
                                      <Receipt className="h-4 w-4" />
                                      View
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View payment receipt</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="py-2 px-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Open in new tab
                                        window.open(
                                          `/dashboard/student/${studentData.id}/enrollment/${payment.enrollmentId}`,
                                          "_blank",
                                        )
                                      }}
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View enrollment details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPayments > paymentsLimit && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {payments.length} of {totalPayments} payments
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                          disabled={paymentsPage === 1 || isLoadingPayments}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {paymentsPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentsPage((p) => p + 1)}
                          disabled={paymentsPage >= totalPages || isLoadingPayments}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-6 text-muted-foreground">No payment records found for this student</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditStudentDialog
        student={studentData}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleStudentUpdated}
      />

      <NewEnrollmentDialog
        studentId={student.id}
        open={newEnrollmentDialogOpen}
        onOpenChange={setNewEnrollmentDialogOpen}
        onSuccess={(newEnrollmentId) => {
          toast.success("Enrollment created successfully")
          router.push(`/dashboard/student/${student.id}/enrollment/${newEnrollmentId}`)
        }}
      />

      <PaymentReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        payment={selectedPayment}
        studentName={studentData.name}
        className={selectedPayment && enrollmentDetails[selectedPayment.enrollmentId]?.className}
        sectionName={selectedPayment && enrollmentDetails[selectedPayment.enrollmentId]?.sectionName}
      />
    </div>
  )
}
