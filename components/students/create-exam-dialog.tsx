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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createExamEntry } from "@/lib/actions/student"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  enrollmentId: string
  onSuccess?: () => void
}

const TERMS = ["Term I", "Term II", "Term III", "Term IV"]

export function CreateExamDialog({ open, onOpenChange, studentId, enrollmentId, onSuccess }: CreateExamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    examName: "",
    examType: "",
    examDate: new Date(),
    note: TERMS[0], // Default to Term I
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleTermChange = (term: string) => {
    setFormData((prev) => ({
      ...prev,
      note: term,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const errors: Record<string, string> = {}

      if (!formData.examName.trim()) {
        errors.examName = "Exam name is required"
      }

      if (!formData.examType.trim()) {
        errors.examType = "Exam type is required"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      console.log("Creating exam with data:", formData)

      toast.promise(createExamEntry(studentId, enrollmentId, formData), {
        loading: "Creating exam entry...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)
            // Reset form
            setFormData({
              examName: "",
              examType: "",
              examDate: new Date(),
              note: TERMS[0],
            })

            if (onSuccess) {
              onSuccess()
            }
            return "Exam entry created successfully"
          } else {
            throw new Error(result?.message || "Failed to create exam entry")
          }
        },
        error: (error) => {
          console.error("Error creating exam entry:", error)
          return error.message || "An error occurred while creating exam entry"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error creating exam entry:", error)
      toast.error("An error occurred while creating exam entry")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
          <DialogDescription>Add a new exam entry for this enrollment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="term">Select Term</Label>
              <Select value={formData.note} onValueChange={handleTermChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examName">
                Exam Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="examName"
                name="examName"
                value={formData.examName}
                onChange={handleInputChange}
                placeholder="e.g., Finals, Midterm, Quiz"
                required
              />
              {formErrors.examName && <p className="text-sm text-red-500">{formErrors.examName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">
                Exam Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="examType"
                name="examType"
                value={formData.examType}
                onChange={handleInputChange}
                placeholder="e.g., Final, CT"
                required
              />
              {formErrors.examType && <p className="text-sm text-red-500">{formErrors.examType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examDate">
                Exam Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.examDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.examDate ? format(formData.examDate, "PPP") : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.examDate}
                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, examDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
