"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Printer } from "lucide-react"
import { SCHOOL_NAME } from "@/env"

interface PaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: any
  studentName: string
  className?: string
  sectionName?: string
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  payment,
  studentName,
  className,
  sectionName,
}: PaymentReceiptDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    const receiptContent = document.getElementById("receipt-content")
    const printWindow = window.open("", "_blank")

    if (printWindow && receiptContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                color: #000;
                background-color: #fff;
              }
              .receipt {
                border: 1px solid #ddd;
                padding: 20px;
                background-color: white;
                color: black;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #ddd;
                padding-bottom: 10px;
              }
              .receipt-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
                color: black;
              }
              .receipt-subtitle {
                font-size: 16px;
                color: #666;
              }
              .receipt-info {
                margin-bottom: 20px;
                color: black;
              }
              .receipt-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
              }
              .receipt-label {
                font-weight: bold;
                color: #555;
              }
              .receipt-value {
                text-align: right;
                color: black;
              }
              .receipt-amount {
                font-size: 18px;
                font-weight: bold;
                margin-top: 10px;
                text-align: right;
                color: black;
              }
              .receipt-footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #777;
              }
              .receipt-divider {
                border-top: 1px dashed #ddd;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptContent.innerHTML}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => {
        printWindow.close()
        setIsPrinting(false)
      }
    }
  }

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-black">Payment Receipt</DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="bg-white p-6 text-black">
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-black">{SCHOOL_NAME}</h2>
            <h3 className="text-xl font-semibold text-black">Payment Receipt</h3>
            <p className="text-gray-600 break-all">Receipt ID: {payment.id}</p>
            <p className="text-gray-600">Date: {format(new Date(payment.paidOn), "MMMM d, yyyy")}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-black">Student Name:</span>
              <span className="text-black">{studentName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-black">Class:</span>
              <span className="text-black">{className || "N/A"}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-black">Section:</span>
              <span className="text-black">{sectionName || "N/A"}</span>
            </div>
          </div>

          <div className="border-t border-b py-4 my-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-black">Original Balance:</span>
              <span className="text-black">₹{payment.originalBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-black">Amount Paid:</span>
              <span className="font-bold text-black">₹{payment.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-black">Remaining Balance:</span>
              <span className="text-black">₹{payment.remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right mt-6">
            <div className="text-xl font-bold text-black">Total Paid: ₹{payment.paidAmount.toLocaleString()}</div>
          </div>

          <div className="mt-10 text-center text-gray-600 text-sm">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated receipt and does not require a signature.</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {isPrinting ? "Printing..." : "Print Receipt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
