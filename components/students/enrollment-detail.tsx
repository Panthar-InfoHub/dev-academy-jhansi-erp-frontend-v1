"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { completeStudentEnrollment, monthlyFeeEntry } from "@/types/student"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, isBefore, isAfter } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Copy, Calendar, BookOpen, Plus, CreditCard } from "lucide-react"
import { deleteEnrollment } from "@/lib/actions/student"
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

interface EnrollmentDetailProps {
  enrollment: completeStudentEnrollment
  studentId: string
}

export function EnrollmentDetail({ enrollment, studentId }: EnrollmentDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortedMonthlyFees, setSortedMonthlyFees] = useState<monthlyFeeEntry[]>([])
  const [feeSummary, setFeeSummary] = useState({
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    futureAmount: 0,
  })

  useEffect(() => {
    if (enrollment.monthlyFees) {
      // Sort monthly fees by due date (ascending)
      const sorted = [...enrollment.monthlyFees].sort((a, b) => {
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
    }
  }, [enrollment.monthlyFees])

  const handleDeleteEnrollment = async () => {
    setIsDeleting(true)

    toast.promise(deleteEnrollment(studentId, enrollment.id, false), {
      loading: "Deleting enrollment...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push(`/dashboard/student/${studentId}`)
          return "Enrollment deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete enrollment")
        }
      },
      error: (error) => {
        console.error("Error deleting enrollment:", error)
        return "An error occurred while deleting enrollment"
      },
      finally: () => {
        setIsDeleting(false)
      },
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Enrollment ID copied to clipboard")
  }

  const getFeeStatus = (fee: monthlyFeeEntry) => {
    const now = new Date()
    const dueDate = new Date(fee.dueDate)

    if (fee.balance === 0) {
      return { status: "Paid", variant: "default" }
    } else if (isAfter(dueDate, now)) {
      return { status: "Future", variant: "outline" }
    } else {
      return { status: "Due", variant: "destructive" }
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
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Enrollment
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
                {enrollment.classRoom?.name || "Class"} - {enrollment.classSection?.name || "Section"}
              </h1>
              <Badge variant={enrollment.isActive ? "default" : "outline"}>
                {enrollment.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={enrollment.isComplete ? "success" : "secondary"} className="bg-orange-500">
                {enrollment.isComplete ? "Completed" : "In Progress"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">ID: {enrollment.id}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(enrollment.id)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <Calendar className="inline-block mr-1 h-3.5 w-3.5" />
              {format(new Date(enrollment.sessionStart), "MMMM yyyy")} to{" "}
              {format(new Date(enrollment.sessionEnd), "MMMM yyyy")}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Monthly Fee:</span>
              <span className="font-bold">₹{enrollment.monthlyFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">One-time Fee:</span>
              <span className="font-bold">₹{(enrollment.one_time_fee || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Details Card - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium text-right">{enrollment.student?.name || "Unknown"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium text-right">{enrollment.classRoom?.name || "Unknown"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Section</span>
            <span className="font-medium text-right">{enrollment.classSection?.name || "Unknown"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Session Start</span>
            <span className="font-medium text-right">{format(new Date(enrollment.sessionStart), "MMMM do, yyyy")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Session End</span>
            <span className="font-medium text-right">{format(new Date(enrollment.sessionEnd), "MMMM do, yyyy")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Created At</span>
            <span className="font-medium text-right">{format(new Date(enrollment.createdAt), "MMMM do, yyyy")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium text-right">{format(new Date(enrollment.updatedAt), "MMMM do, yyyy")}</span>
          </div>
        </CardContent>
      </Card>

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
              {enrollment.subjects && enrollment.subjects.length > 0 ? (
                <div className="space-y-4">
                  {enrollment.subjects.map((subject, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{subject.name}</h3>
                        </div>
                        <Badge variant="outline">{subject.code}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant={subject.theoryExam ? "default" : "outline"} className="bg-blue-500">
                          Theory Exam
                        </Badge>
                        <Badge variant={subject.practicalExam ? "default" : "outline"} className="bg-green-500">
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
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Fees
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium text-right">₹{feeSummary.totalAmount.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-medium text-right text-green-600">₹{feeSummary.paidAmount.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Due Amount</span>
                <span className="font-medium text-right text-red-600">₹{feeSummary.dueAmount.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Future Payments</span>
                <span className="font-medium text-right text-blue-600">
                  ₹{feeSummary.futureAmount.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Monthly Fee</span>
                <span className="font-medium text-right">₹{enrollment.monthlyFee.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">One-time Fee</span>
                <span className="font-medium text-right">₹{(enrollment.one_time_fee || 0).toLocaleString()}</span>
              </div>
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
                        <th className="py-2 px-4 text-left">Due Date</th>
                        <th className="py-2 px-4 text-left">Amount Due</th>
                        <th className="py-2 px-4 text-left">Amount Paid</th>
                        <th className="py-2 px-4 text-left">Balance</th>
                        <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMonthlyFees.map((fee, index) => {
                        const feeStatus = getFeeStatus(fee)
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4">{format(new Date(fee.dueDate), "MMM d, yyyy")}</td>
                            <td className="py-2 px-4">₹{fee.feeDue.toLocaleString()}</td>
                            <td className="py-2 px-4">₹{fee.amountPaid.toLocaleString()}</td>
                            <td className="py-2 px-4">₹{fee.balance.toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <Badge variant={feeStatus.variant as any}>{feeStatus.status}</Badge>
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
              {enrollment.feePayments && enrollment.feePayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Amount</th>
                        <th className="py-2 px-4 text-left">Original Balance</th>
                        <th className="py-2 px-4 text-left">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollment.feePayments.map((payment, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{format(new Date(payment.paidOn), "MMM d, yyyy")}</td>
                          <td className="py-2 px-4">₹{payment.paidAmount.toLocaleString()}</td>
                          <td className="py-2 px-4">₹{payment.originalBalance.toLocaleString()}</td>
                          <td className="py-2 px-4">₹{payment.remainingBalance.toLocaleString()}</td>
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
                <CardTitle>Exam Details</CardTitle>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exam
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enrollment.examDetails && enrollment.examDetails.length > 0 ? (
                <div className="space-y-4">
                  {enrollment.examDetails.map((exam, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium">{exam.examName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exam.examDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant={exam.studentPassed ? "success" : "destructive"}>
                          {exam.studentPassed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Type: {exam.examType}</span>
                        {exam.note && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Note:</span> {exam.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">No exam records found for this enrollment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
