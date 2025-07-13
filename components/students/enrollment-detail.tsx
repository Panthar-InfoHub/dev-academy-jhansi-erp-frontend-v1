"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type {completeStudentEnrollment, monthlyFeeEntry, examEntry, feePayment} from "@/types/student"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, isBefore, isAfter, isSameDay } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  BookOpen,
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { deleteEnrollment, getEnrollmentDetails, deleteExamEntry, resetEnrollment } from "@/lib/actions/student"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { EditEnrollmentDialog } from "./edit-enrollment-dialog"
import { PayFeesDialog } from "./pay-fees-dialog"
import { PaymentReceiptDialog } from "./payment-receipt-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BACKEND_SERVER_URL } from "@/env"
import { CreateExamDialog } from "./create-exam-dialog"
import { UpdateExamDialog } from "./update-exam-dialog"
import { ResultDialog } from "@/components/students/result-dialog"
import { ExamAccordion } from "@/components/students/exam-accordion"
import { Input } from "@/components/ui/input"

interface EnrollmentDetailProps {
  enrollment: completeStudentEnrollment
  studentId: string
}

export function EnrollmentDetail({ enrollment, studentId }: EnrollmentDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("fees") // Set default tab to "fees"
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortedMonthlyFees, setSortedMonthlyFees] = useState<monthlyFeeEntry[]>([])
  const [feeSummary, setFeeSummary] = useState({
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    futureAmount: 0,
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [payFeesDialogOpen, setPayFeesDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<feePayment>(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState<completeStudentEnrollment>(enrollment)
  const [allFeesPaid, setAllFeesPaid] = useState(false)
  const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false)
  const [updateExamDialogOpen, setUpdateExamDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<examEntry | null>(null)
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [examsByTerm, setExamsByTerm] = useState<Record<string, examEntry[]>>({})
  const [examToDelete, setExamToDelete] = useState<examEntry | null>(null)
  const [isDeletingExam, setIsDeletingExam] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [newFeeAmount, setNewFeeAmount] = useState<number | undefined>(undefined)
  const [receiptStartingMonth, setReceiptStartingMonth] = useState<Date | undefined>()
  const [receiptEndingMonth, setReceiptEndingMonth] = useState<Date | undefined>()

  // Get student initials for avatar
  const studentName = enrollmentData.student?.name || "Student"
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/student/${enrollmentData.studentId}/profileImg`

  useEffect(() => {
    if (enrollmentData.monthlyFees) {
      // Sort monthly fees by due date (ascending)
      const sorted = [...enrollmentData.monthlyFees].sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      setSortedMonthlyFees(sorted)

      // Calculate fee summary
      const now = new Date()
      let totalAmount = 0
      let paidAmount = 0
      let dueAmount = 0
      let futureAmount = 0

      sorted.forEach((fee) => {
        const dueDate = new Date(fee.dueDate)
        totalAmount += fee.feeDue
        paidAmount += fee.amountPaid

        if (isBefore(dueDate, now) && fee.balance > 0) {
          dueAmount += fee.balance
        } else if (isAfter(dueDate, now)) {
          futureAmount += fee.balance
        }
      })

      setFeeSummary({
        totalAmount,
        paidAmount,
        dueAmount,
        futureAmount,
      })

      // Check if all fees are paid
      setAllFeesPaid(dueAmount === 0 && totalAmount === paidAmount)
    }
  }, [enrollmentData.monthlyFees])

  useEffect(() => {
    if (enrollmentData.examDetails) {
      organizeExamsByTerm(enrollmentData.examDetails)
    }
  }, [enrollmentData.examDetails])

  useEffect(() => {
    navigator.clipboard.writeText(JSON.stringify(enrollment, null, 2))
  }, []);

  useEffect(() => {

    if (selectedPayment && selectedPayment.monthlyFeeIds) {
      // Directly find the relevant fees using the IDs provided by the backend.
      const relevantFees = sortedMonthlyFees.filter((fee) =>
          selectedPayment.monthlyFeeIds.includes(fee.id)
      )

      if (relevantFees.length > 0) {
        const dueDates = relevantFees.map((fee) => new Date(fee.dueDate))
        const startingMonth = new Date(Math.min(...dueDates.map((d) => d.getTime())))
        const endingMonth = new Date(Math.max(...dueDates.map((d) => d.getTime())))
        setReceiptStartingMonth(startingMonth)
        setReceiptEndingMonth(endingMonth)
      } else {
        // Reset if no associated fees are found
        setReceiptStartingMonth(undefined)
        setReceiptEndingMonth(undefined)
      }
    }
  }, [selectedPayment, sortedMonthlyFees])


  const organizeExamsByTerm = (exams: examEntry[]) => {
    const groupedExams: Record<string, examEntry[]> = {}

    exams.forEach((exam) => {
      const term = exam.term || "Uncategorized"
      if (!groupedExams[term]) {
        groupedExams[term] = []
      }
      groupedExams[term].push(exam)
    })

    // Sort terms in order (Term I, Term II, Term III, Term IV, others)
    const sortedGroupedExams: Record<string, examEntry[]> = {}
    const termOrder = ["Term I", "Term II", "Term III", "Term IV"]

    // Add terms in order
    termOrder.forEach((term) => {
      if (groupedExams[term]) {
        sortedGroupedExams[term] = groupedExams[term]
        delete groupedExams[term]
      }
    })

    // Add remaining terms
    Object.keys(groupedExams)
      .sort()
      .forEach((term) => {
        sortedGroupedExams[term] = groupedExams[term]
      })

    setExamsByTerm(sortedGroupedExams)
  }

  const handleDeleteEnrollment = async () => {
    setIsDeleting(true)

    toast.promise(deleteEnrollment(studentId, enrollmentData.id, false), {
      loading: "Deleting enrollment...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push(`/dashboard/student/${studentId}`)
          return result.message || "Enrollment deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete enrollment")
        }
      },
      error: (error) => {
        console.error("Error deleting enrollment:", error)
        return error.message || "An error occurred while deleting enrollment"
      },
      finally: () => {
        setIsDeleting(false)
      },
    })
  }

  const handleResetEnrollment = async () => {
    console.log("Resetting enrollment:", enrollmentData.id, "with new fee amount:", newFeeAmount)
    setIsResetting(true)

    toast.promise(resetEnrollment(studentId, enrollmentData.id, newFeeAmount), {
      loading: "Resetting enrollment...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          // Reload the page to get the latest data
          window.location.reload()
          return result.message || "Enrollment reset successfully"
        } else {
          throw new Error(result?.message || "Failed to reset enrollment")
        }
      },
      error: (error) => {
        console.error("Error resetting enrollment:", error)
        return error.message || "An error occurred while resetting enrollment"
      },
      finally: () => {
        setIsResetting(false)
        setResetDialogOpen(false)
      },
    })
  }

  const handleDeleteExam = async () => {
    if (!examToDelete) return

    setIsDeletingExam(true)

    console.log("Deleting exam:", examToDelete.examEntryId)

    toast.promise(deleteExamEntry(studentId, enrollmentData.id, examToDelete.examEntryId), {
      loading: "Deleting exam...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          setExamToDelete(null)
          refreshEnrollmentData()
          return "Exam deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete exam")
        }
      },
      error: (error) => {
        console.error("Error deleting exam:", error)
        return error.message || "An error occurred while deleting exam"
      },
      finally: () => {
        setIsDeletingExam(false)
      },
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("ID copied to clipboard")
  }

  const handleEnrollmentUpdated = (updatedEnrollment: completeStudentEnrollment) => {
    // Update local state with the updated enrollment data
    setEnrollmentData(updatedEnrollment)
    setEditDialogOpen(false)
    toast.success("Enrollment updated successfully")
  }

  const handlePaymentSuccess = () => {
    refreshEnrollmentData()
    toast.success("Payment processed successfully")
  }

  const getFeeStatus = (fee: monthlyFeeEntry) => {
    const now = new Date()
    const dueDate = new Date(fee.dueDate)

    if (fee.balance === 0) {
      return { status: "Paid", variant: "default" }
    } else if (isAfter(dueDate, now)) {
      return { status: "N/A", variant: "secondary", color: "text-blue-600" }
    } else {
      return { status: "Due", variant: "destructive" }
    }
  }

  const showPaymentReceipt = (payment: any) => {
    setSelectedPayment(payment)
    setReceiptDialogOpen(true)
  }

  const handleUpdateExam = (exam: examEntry) => {
    setSelectedExam(exam)
    setUpdateExamDialogOpen(true)
  }

  const refreshEnrollmentData = async () => {
    setIsLoadingExams(true)
    try {
      const result = await getEnrollmentDetails(studentId, enrollmentData.id)
      if (result?.status === "SUCCESS" && result.data) {
        setEnrollmentData(result.data)
        organizeExamsByTerm(result.data.examDetails || [])
      } else {
        toast.error("Failed to refresh enrollment data")
      }
    } catch (error) {
      console.error("Error refreshing enrollment data:", error)
      toast.error("An error occurred while refreshing enrollment data")
    } finally {
      setIsLoadingExams(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push(`/dashboard/student/${studentId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Student
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Enrollment
          </Button>
          <Button
            variant="outline"
            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Enrollment
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Enrollment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this enrollment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the enrollment and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEnrollment}
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

      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {enrollmentData.classRoom?.name || "Class"} - {enrollmentData.classSection?.name || "Section"}
              </h1>
              <Badge variant={enrollmentData.isActive ? "default" : "outline"}>
                {enrollmentData.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="secondary"
                className={
                  enrollmentData.isComplete
                    ? "bg-orange-100 text-orange-800 hover:bg-orange-100/80 dark:bg-orange-900 dark:text-orange-300"
                    : ""
                }
              >
                {enrollmentData.isComplete ? "Completed" : "In Progress"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground">Enrollment ID: {enrollmentData.id}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for this enrollment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(enrollmentData.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground">Student ID: {enrollmentData.studentId}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for the student</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyId(enrollmentData.studentId)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground">Class ID: {enrollmentData.classroomId}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for the class</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyId(enrollmentData.classroomId)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground">
                        Section ID: {enrollmentData.classroomSectionId}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for the section</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyId(enrollmentData.classroomSectionId)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Monthly Fee:</span>
                    <span className="font-bold">₹{enrollmentData.monthlyFee.toLocaleString()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Monthly fee amount for this enrollment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">One-time Fee:</span>
                    <span className="font-bold">₹{(enrollmentData.one_time_fee || 0).toLocaleString()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>One-time fee charged at enrollment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Redesigned Enrollment Information Cards - Three separate cards in a grid with non-boxed layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Student Info Card - 3 columns */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-center">Student</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-muted">
              <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={studentName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-center text-lg">{studentName}</span>
          </CardContent>
        </Card>

        {/* Class Info Card - 6 columns with non-boxed layout */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle className="text-center">Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground">Class</div>
                <div className="font-medium text-lg">{enrollmentData.classRoom?.name || "Unknown"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground">Section</div>
                <div className="font-medium text-lg">{enrollmentData.classSection?.name || "Unknown"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Session Start
                </div>
                <div className="font-medium">{format(new Date(enrollmentData.sessionStart), "MMMM do, yyyy")}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Session End
                </div>
                <div className="font-medium">{format(new Date(enrollmentData.sessionEnd), "MMMM do, yyyy")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps Card - 3 columns with non-boxed layout */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-center">Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Created At
                </div>
                <div className="font-medium">{format(new Date(enrollmentData.createdAt), "MMM d, yyyy")}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Last Updated
                </div>
                <div className="font-medium">{format(new Date(enrollmentData.updatedAt), "MMM d, yyyy")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="fees">Fee Details</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentData.subjects && enrollmentData.subjects.length > 0 ? (
                <div className="space-y-4">
                  {enrollmentData.subjects.map((subject, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{subject.name}</h3>
                        </div>
                        <Badge variant="outline">{subject.code}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge
                          variant={subject.theoryExam ? "default" : "outline"}
                          className={
                            subject.theoryExam
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300"
                              : ""
                          }
                        >
                          Theory Exam
                        </Badge>
                        <Badge
                          variant={subject.practicalExam ? "default" : "outline"}
                          className={
                            subject.practicalExam
                              ? "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300"
                              : ""
                          }
                        >
                          Practical Exam
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No subjects found for this enrollment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Fee Summary</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => setPayFeesDialogOpen(true)}
                          disabled={enrollmentData.isComplete || allFeesPaid}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Fees
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {enrollmentData.isComplete
                          ? "Enrollment is marked as complete, no more payments needed"
                          : allFeesPaid
                            ? "All fees have been paid"
                            : "Process a fee payment for this enrollment"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-medium text-right">₹{feeSummary.totalAmount.toLocaleString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total fee amount for the entire enrollment period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Paid Amount</span>
                      <span className="font-medium text-right text-green-600">
                        ₹{feeSummary.paidAmount.toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total amount paid so far</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Due Amount</span>
                      <span className="font-medium text-right text-red-600">
                        ₹{feeSummary.dueAmount.toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Amount currently due (past due dates with unpaid balance)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Future Payments</span>
                      <span className="font-medium text-right text-blue-600">
                        ₹{feeSummary.futureAmount.toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Amount due in future months</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Monthly Fee</span>
                      <span className="font-medium text-right">₹{enrollmentData.monthlyFee.toLocaleString()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Monthly fee amount</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">One-time Fee</span>
                      <span className="font-medium text-right">
                        ₹{(enrollmentData.one_time_fee || 0).toLocaleString()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>One-time fee charged at enrollment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Fee Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedMonthlyFees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left border-r">Due Date</th>
                        <th className="py-2 px-4 text-left border-r">Amount Due</th>
                        <th className="py-2 px-4 text-left border-r">Amount Paid</th>
                        <th className="py-2 px-4 text-left border-r">Balance</th>
                        <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMonthlyFees.map((fee, index) => {
                        const feeStatus = getFeeStatus(fee)
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4 border-r">{format(new Date(fee.dueDate), "MMM d, yyyy")}</td>
                            <td className="py-2 px-4 border-r">₹{fee.feeDue.toLocaleString()}</td>
                            <td className="py-2 px-4 border-r">₹{fee.amountPaid.toLocaleString()}</td>
                            <td className="py-2 px-4 border-r">₹{fee.balance.toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <Badge
                                variant={feeStatus.variant as any}
                                className={
                                  feeStatus.status === "N/A"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300"
                                    : ""
                                }
                              >
                                {feeStatus.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No monthly fee schedule found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentData.feePayments && enrollmentData.feePayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left border-r">Date</th>
                        <th className="py-2 px-4 text-left border-r">Amount</th>
                        <th className="py-2 px-4 text-left border-r">Original Balance</th>
                        <th className="py-2 px-4 text-left border-r">Remaining Balance</th>
                        <th className="py-2 px-4 text-left border-r">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollmentData.feePayments.map((payment, index) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No payment history found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Examination Results</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={refreshEnrollmentData}
                    disabled={isLoadingExams}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingExams ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCreateExamDialogOpen(true)}
                    disabled={!enrollmentData.isActive}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Exam Entry
                  </Button>
                </div>
              </div>
              <CardDescription>Academic performance in theory and practical examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExams ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : examsByTerm && Object.keys(examsByTerm).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(examsByTerm).map(([term, exams]) => (
                    <ExamAccordion
                      key={term}
                      term={term}
                      exams={exams}
                      onUpdateExam={handleUpdateExam}
                      onDeleteExam={(exam) => setExamToDelete(exam)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No exam records found for this enrollment</p>
                  <Button onClick={() => setCreateExamDialogOpen(true)} disabled={!enrollmentData.isActive}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Exam
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Result Card</CardTitle>
                <ResultDialog
                  examDetails={enrollmentData.examDetails}
                  subjects={enrollmentData.subjects}
                  className={enrollmentData.classRoom?.name || ""}
                  fathersName={enrollmentData.student?.fatherName || ""}
                  dob={
                    enrollmentData.student?.dateOfBirth
                      ? format(new Date(enrollmentData.student.dateOfBirth), "dd-MM-yyyy")
                      : ""
                  }
                  studentName={enrollmentData.student?.name || ""}
                  sectionName={enrollmentData.classSection?.name || ""}
                  buttonText="View Full Result Card"
                />
              </div>
              <CardDescription>View and download the student's result card</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <EditEnrollmentDialog
        enrollment={enrollmentData}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEnrollmentUpdated}
      />

      <PayFeesDialog
        enrollment={enrollmentData}
        open={payFeesDialogOpen}
        onOpenChange={setPayFeesDialogOpen}
        onSuccess={handlePaymentSuccess}
        studentId={studentId}
      />

      {selectedPayment && (
          <PaymentReceiptDialog
              open={receiptDialogOpen}
              onOpenChange={setReceiptDialogOpen}
              payment={selectedPayment}
              studentName={enrollmentData.student?.name || ""}
              className={enrollmentData.classRoom?.name}
              sectionName={enrollmentData.classSection?.name}
              startingMonth={receiptStartingMonth}
              endingMonth={receiptEndingMonth}
          />
      )}

      <CreateExamDialog
        open={createExamDialogOpen}
        onOpenChange={setCreateExamDialogOpen}
        studentId={studentId}
        enrollmentId={enrollmentData.id}
        onSuccess={refreshEnrollmentData}
      />

      <UpdateExamDialog
        open={updateExamDialogOpen}
        onOpenChange={setUpdateExamDialogOpen}
        studentId={studentId}
        enrollmentId={enrollmentData.id}
        exam={selectedExam}
        onSuccess={refreshEnrollmentData}
      />

      {/* Reset Enrollment Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all fee details for this enrollment, allowing you to start over from scratch. All payment
              history and monthly fee entries will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="newFeeAmount" className="text-sm font-medium">
                New Monthly Fee Amount (Optional)
              </label>
              <Input
                id="newFeeAmount"
                type="number"
                placeholder="Enter new fee amount"
                value={newFeeAmount === undefined ? "" : newFeeAmount}
                onChange={(e) => setNewFeeAmount(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to keep the current monthly fee amount (₹{enrollmentData.monthlyFee.toLocaleString()})
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetEnrollment}
              disabled={isResetting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Enrollment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Exam Confirmation Dialog */}
      <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the exam "{examToDelete?.examName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingExam}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
              disabled={isDeletingExam}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingExam ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
