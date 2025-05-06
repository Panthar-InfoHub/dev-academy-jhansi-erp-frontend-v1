"use client"

import { CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ExternalLink, Receipt, RefreshCw, ChevronDown } from "lucide-react"
import { getPayments } from "@/lib/actions/analytics"
import { getAllSectionsOfClassroom, getClassroomDetails } from "@/lib/actions/classroom"
import { format, subDays } from "date-fns"
import { useRouter } from "next/navigation"
import { PaymentReceiptDialog } from "@/components/students/payment-receipt-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"
import ClassroomCache from "@/lib/cache/classroom-cache"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PaymentInfo, PaymentsInfoResponse } from "@/types/analytics";
import { getEnrollmentDetails, getStudent } from "@/lib/actions/student";

// Type for enrollment details with class and section info
type EnrollmentDetails = {
  studentName: string;
  className: string
  sectionName: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentsInfoResponse["payments"]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [enrollmentDetails, setEnrollmentDetails] = useState<Record<string, EnrollmentDetails>>({})
  const cache = ClassroomCache.getInstance()

  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)

  const [startDate, setStartDate] = useState<Date | null>(thirtyDaysAgo)
  const [endDate, setEndDate] = useState<Date | null>(today)
  const [ascending, setAscending] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [page, startDate, endDate, limit, ascending])

  async function fetchPayments() {
    setIsLoading(true)
    try {
      const result = await getPayments(startDate, endDate, page, limit, ascending)

      if (result?.status === "SUCCESS" && result.data) {
        setPayments((result.data as PaymentsInfoResponse).payments || [])
        setTotalPayments((result.data as PaymentsInfoResponse).count || 0)
        setTotalPages(Math.ceil((result.data as PaymentsInfoResponse).count / limit) || 1)

        // Fetch class and section details for each payment
        fetchEnrollmentDetailsWithCaching((result.data as PaymentsInfoResponse).payments || [])
      } else {
        toast.error(result?.message || "Failed to fetch payments")
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("An error occurred while fetching payments")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchEnrollmentDetailsWithCaching(paymentsData: PaymentsInfoResponse["payments"]) {
    // Create a unique set of enrollment IDs to fetch
    const enrollmentIds = [...new Set(paymentsData.map((payment) => payment.enrollmentId))]

    // Create a map to store enrollment details
    const details: Record<string, EnrollmentDetails> = {}

    // Process each enrollment ID
    for (const enrollmentId of enrollmentIds) {
      // Check if we already have this in our cache
      const cacheKey = `payment_enrollment_${enrollmentId}`
      const cachedDetails = cache.get<EnrollmentDetails>(cacheKey)

      if (cachedDetails) {
        details[enrollmentId] = cachedDetails
        continue
      }

      try {
        
        // Find a payment with this enrollment ID to get the student ID
        const payment = paymentsData.find((p) => p.enrollmentId === enrollmentId)
        if (!payment) continue

        // Fetch all classrooms
        const student = await getStudent(payment.studentId)
        const enrollmentData = await getEnrollmentDetails(payment.studentId, payment.enrollmentId)
        const classroomData = await getClassroomDetails(enrollmentData.data.classroomId)
        const sectionData = await getAllSectionsOfClassroom(enrollmentData.data.classroomId)
        const section = sectionData.find((s) => s.id === enrollmentData.data.classroomSectionId)
        
        if ( "name" in classroomData ) {
          details[enrollmentId] = {
            studentName: student.data.name,
            className: classroomData.name!,
            sectionName: section.name,
          }
        }

        // Cache the result
            cache.set(cacheKey, details[enrollmentId])
        
        break
        
        
      } catch (error) {
        console.error(`Error fetching details for enrollment ${enrollmentId}:`, error)
      }
    }

    setEnrollmentDetails(details)
  }

  // Helper function to get classroom and section names
  const getEnrollmentInfo = (enrollmentId: string) => {
    return enrollmentDetails[enrollmentId] || { className: "Loading...", sectionName: "Loading...", studentName: "Loading..." }
  }

  const showPaymentReceipt = (payment: PaymentInfo) => {
    const info = getEnrollmentInfo(payment.enrollmentId)

    // Add class and section info to the payment object
    
    
    const paymentWithDetails = {
      ...payment,
      studentName: info.studentName,
      className: info.className,
      sectionName: info.sectionName,
    }
    

    setSelectedPayment(paymentWithDetails)
    setReceiptDialogOpen(true)
  }
  

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recent Payments</h1>
        <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <EnhancedCalendar selected={startDate} onSelect={setStartDate} className="w-auto" />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <EnhancedCalendar selected={endDate} onSelect={setEndDate} className="w-auto" />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="limit">Page Size</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[80px]">
                    {limit} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLimit(10)}>10</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLimit(25)}>25</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLimit(50)}>50</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLimit(100)}>100</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="ascending">Sort Ascending</Label>
              <Checkbox id="ascending" checked={ascending} onCheckedChange={(checked) => setAscending(!!checked)} />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const enrollmentInfo = getEnrollmentInfo(payment.enrollmentId)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.paidOn), "MMM d, yyyy")}</TableCell>
                        <TableCell>₹{payment.paidAmount.toLocaleString()}</TableCell>
                        <TableCell>{payment.studentId}</TableCell>
                        <TableCell>{enrollmentInfo.className}</TableCell>
                        <TableCell>{enrollmentInfo.sectionName}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showPaymentReceipt(payment)}
                              className="flex items-center gap-1"
                            >
                              <Receipt className="h-4 w-4" />
                              Receipt
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/dashboard/student/${payment.studentId}/enrollment/${payment.enrollmentId}`,
                                  "_blank",
                                )
                              }
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Enrollment
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {payments.length} of {totalPayments} payments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        payment={selectedPayment}
        studentName={selectedPayment?.studentName}
        className={selectedPayment?.className}
        sectionName={selectedPayment?.sectionName}
      />
    </div>
  )
}
