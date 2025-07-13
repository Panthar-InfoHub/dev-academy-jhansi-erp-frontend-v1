"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Download } from "lucide-react"
import { SCHOOL_NAME } from "@/env"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import {feePayment} from "@/types/student";

interface PaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: feePayment
  studentName: string
  className?: string
  sectionName?: string
  startingMonth?: Date
  endingMonth?: Date
  type?: "tuition-fee" | "one-time-fee"
}

export function PaymentReceiptDialog({
                                       open,
                                       onOpenChange,
                                       payment,
                                       studentName,
                                       className,
                                       sectionName,
                                       startingMonth,
                                       endingMonth,
                                       type = "tuition-fee",
                                     }: PaymentReceiptDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(() => {
    if (receiptRef.current === null) {
      toast.error("Could not generate receipt image")
      return
    }

    setIsDownloading(true)
    toast.info("Generating receipt image...")

    const shortId = payment?.id ? (payment.id.split("_")[1] || "").substring(0, 8) : "receipt"
    const filename = `${studentName ? studentName.replace(/ /g, "_") + "-" : ""}${type}-${shortId}.png`

    toPng(receiptRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "white",
    })
        .then((dataUrl) => {
          const link = document.createElement("a")
          link.download = filename
          link.href = dataUrl
          link.click()
          toast.success("Receipt downloaded successfully")
        })
        .catch((err) => {
          console.error("Error generating image:", err)
          toast.error("Failed to download receipt")
        })
        .finally(() => {
          setIsDownloading(false)
        })
  }, [payment, studentName, type])

  const formatMonthRange = () => {
    if (!startingMonth) {
      return null
    }

    const start = format(startingMonth, "MMMM yyyy")

    if (endingMonth && format(endingMonth, "MMMM yyyy") !== start) {
      const end = format(endingMonth, "MMMM yyyy")
      return `${start} - ${end}`
    }

    return start
  }

  if (!payment) return null

  const paymentTypeDescription = type === "one-time-fee" ? "One-Time Fee" : "Tuition Fee"

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-black">Payment Receipt</DialogTitle>
          </DialogHeader>

          <div id="receipt-content" ref={receiptRef} className="bg-white p-6 text-black">
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
              <div className="flex justify-between mb-2">
                <span className="font-medium text-black">Payment For:</span>
                <span className="text-black">{paymentTypeDescription}</span>
              </div>
              {type === "tuition-fee" && startingMonth && (
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-black">Fee for Month(s):</span>
                    <span className="text-black">{formatMonthRange()}</span>
                  </div>
              )}
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
            <Button
                variant="default"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 text-black"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download Receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}
