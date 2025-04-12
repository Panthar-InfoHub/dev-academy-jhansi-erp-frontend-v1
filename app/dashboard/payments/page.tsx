"use client"

import { CardTitle } from "@/components/ui/card"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ExternalLink, Receipt, RefreshCw, CalendarIcon } from "lucide-react"
import { getPayments } from "@/lib/actions/analytics"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { PaymentReceiptDialog } from "@/components/students/payment-receipt-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const router = useRouter()

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [ascending, setAscending] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [page, startDate, endDate, limit, ascending])

  async function fetchPayments() {
    setIsLoading(true)
    try {
      const result = await getPayments(startDate, endDate, page, limit, ascending)

      if (result?.status === "SUCCESS" && result.data) {
        setPayments(result.data.payments || [])
        setTotalPayments(result.data.count || 0)
        setTotalPages(Math.ceil(result.data.count / limit) || 1)
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
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? <span className="mr-2">{format(startDate, "PPP")}</span> : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? <span className="mr-2">{format(endDate, "PPP")}</span> : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate || date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="limit">Page Size</Label>
              <select
                id="limit"
                className="border rounded px-2 py-1"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
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
