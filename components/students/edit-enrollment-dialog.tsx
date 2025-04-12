"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { completeStudentEnrollment, updateEnrollmentBody } from "@/types/student"
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
import { updateEnrollment } from "@/lib/actions/student"
import { Checkbox } from "@/components/ui/checkbox"

interface EditEnrollmentDialogProps {
  enrollment: completeStudentEnrollment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedEnrollment: completeStudentEnrollment) => void
}

export function EditEnrollmentDialog({ enrollment, open, onOpenChange, onSuccess }: EditEnrollmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [startDateMonth, setStartDateMonth] = useState<Date>(new Date(enrollment.sessionStart))
  const [endDateMonth, setEndDateMonth] = useState<Date>(new Date(enrollment.sessionEnd))

  // Enrollment form state
  const [formData, setFormData] = useState<updateEnrollmentBody>({
    isActive: enrollment.isActive,
    isComplete: enrollment.isComplete,
    one_time_fee: enrollment.one_time_fee || 0,
  })

  // Reset form when the dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        isActive: enrollment.isActive,
        isComplete: enrollment.isComplete,
        one_time_fee: enrollment.one_time_fee || 0,
      })
      setStartDateMonth(new Date(enrollment.sessionStart))
      setEndDateMonth(new Date(enrollment.sessionEnd))
      setFormErrors({})
    }
  }, [open, enrollment])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value !== "" ? Number(value) : 0,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
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

      if (formData.one_time_fee !== undefined && formData.one_time_fee < 0) {
        errors.one_time_fee = "One-time fee cannot be negative"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(updateEnrollment(enrollment.studentId, enrollment.id, formData), {
        loading: "Updating enrollment...",
        success: (result) => {
          if (result?.status === "SUCCESS" && result.data) {
            onOpenChange(false)
            if (onSuccess) {
              onSuccess(result.data)
            }
            return result.message || "Enrollment updated successfully"
          } else {
            throw new Error(result?.message || "Failed to update enrollment")
          }
        },
        error: (error) => {
          console.error("Error updating enrollment:", error)
          return error.message || "An error occurred while updating enrollment"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error updating enrollment:", error)
      toast.error("An error occurred while updating enrollment")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Enrollment</DialogTitle>
          <DialogDescription>Update enrollment details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="one_time_fee">One-time Fee</Label>
              <Input
                id="one_time_fee"
                name="one_time_fee"
                type="number"
                value={formData.one_time_fee}
                onChange={handleInputChange}
                min="0"
              />
              {formErrors.one_time_fee && <p className="text-sm text-red-500">{formErrors.one_time_fee}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive">Active Enrollment</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isComplete"
                checked={formData.isComplete}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isComplete: !!checked }))}
              />
              <Label htmlFor="isComplete">Mark as Completed</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Enrollment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
