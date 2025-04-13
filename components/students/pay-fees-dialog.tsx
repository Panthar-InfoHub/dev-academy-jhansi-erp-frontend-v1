"use client"

import type React from "react"

import { useState } from "react"
import type { completeStudentEnrollment, payStudentFeeBody } from "@/types/student"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { payStudentFee } from "@/lib/actions/student"
import { useRouter } from "next/navigation"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup";

interface PayFeesDialogProps {
  enrollment: completeStudentEnrollment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  studentId: string
}

export function PayFeesDialog({ enrollment, open, onOpenChange, onSuccess, studentId }: PayFeesDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Calculate total due amount
  const totalDueAmount =
    enrollment.monthlyFees?.reduce((total, fee) => {
      return total + fee.balance
    }, 0) || 0

  // Payment form state
  const [formData, setFormData] = useState<payStudentFeeBody>({
    paidAmount: totalDueAmount,
    paidOn: new Date(),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "paidAmount") {
      setFormData((prev) => ({
        ...prev,
        [name]: value !== "" ? Number(value) : 0,
      }))
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const errors: Record<string, string> = {}

      if (formData.paidAmount <= 0) {
        errors.paidAmount = "Payment amount must be greater than 0"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(payStudentFee(studentId, enrollment.id, formData), {
        loading: "Processing payment...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)

            // Refresh the page to get updated data
            router.refresh()

            if (onSuccess) {
              onSuccess()
            }
            return result.message || "Payment processed successfully"
          } else {
            throw new Error(result?.message || "Failed to process payment")
          }
        },
        error: (error) => {
          console.error("Error processing payment:", error)
          return error.message || "An error occurred while processing payment"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("An error occurred while processing payment")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay Fees</DialogTitle>
          <DialogDescription>Enter payment details for this enrollment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="totalDue">Total Due Amount</Label>
              <Input id="totalDue" value={`₹${totalDueAmount.toLocaleString()}`} readOnly disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                value={formData.paidAmount}
                onChange={handleInputChange}
                min="1"
                required
              />
              {formErrors.paidAmount && <p className="text-sm text-red-500">{formErrors.paidAmount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidOn">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <EnhancedCalendar selected={formData.paidOn} onSelect={(date) => date && setFormData((prev) => ({ ...prev, paidOn: date }))} />
                </PopoverTrigger>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Process Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
