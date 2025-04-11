"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ExternalLink, Receipt, RefreshCw } from "lucide-react"
import { getStudentPaymentsInfo } from "@/lib/actions/student"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { PaymentReceiptDialog } from "@/components/students/payment-receipt-dialog"

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchPayments()
  }, [page])

  async function fetchPayments() {
    setIsLoading(true)
    try {
      // Fetch all payments (no student ID filter)
      const result = await getStudentPaymentsInfo("", limit, page)

      if (result?.status === "SUCCESS" && result.data) {
        setPayments(result.data.payments || [])
        setTotalPayments(result.data.totalItems || 0)
        setTotalPages(result.data.totalPages || 1)
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

  const showPaymentReceipt = (payment: any) => {
    setSelectedPayment(payment)
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Enrollment ID</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paidOn), "MMM d, yyyy")}</TableCell>
                      <TableCell>₹{payment.paidAmount.toLocaleString()}</TableCell>
                      <TableCell>{payment.studentId}</TableCell>
                      <TableCell>{payment.enrollmentId}</TableCell>
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
                  ))
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
