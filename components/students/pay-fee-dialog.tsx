"use client"

import type React from "react"

import { useState } from "react"
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
import { toast } from "sonner"
import { payStudentFee } from "@/lib/actions/student"
import type { completeStudentEnrollment } from "@/types/student"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"

interface PayFeeDialogProps {
  studentId: string
  enrollment: completeStudentEnrollment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PayFeeDialog({ studentId, enrollment, open, onOpenChange, onSuccess }: PayFeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    paidAmount: 0,
    paidOn: new Date(),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }))

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? String(checked) : value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const errors: Record<string, string> = {}

      if (formData.paidAmount <= 0) {
        errors.paidAmount = "Amount must be greater than zero"
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
            if (onSuccess) onSuccess()
            return "Payment processed successfully"
          } else {
            throw new Error(result?.message || "Failed to process payment")
          }
        },
        error: (error) => {
          console.error("Error processing payment:", error)
          return "An error occurred while processing payment"
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
          <DialogTitle>Pay Student Fee</DialogTitle>
          <DialogDescription>Process a fee payment for this enrollment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paidAmount" className="text-right">
                Amount (₹)
              </Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                value={formData.paidAmount}
                onChange={handleInputChange}
                className="col-span-3"
              />
              {formErrors.paidAmount && (
                <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.paidAmount}</p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Payment Date</Label>
              <div className="col-span-3">
                <EnhancedCalendar
                  selected={formData.paidOn}
                  onSelect={(date) => date && setFormData((prev) => ({ ...prev, paidOn: date }))}
                />
              </div>
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
