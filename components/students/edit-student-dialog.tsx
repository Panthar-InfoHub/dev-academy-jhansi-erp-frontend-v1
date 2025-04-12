"use client"

import type React from "react"

import { useState } from "react"
import type { completeStudentDetails } from "@/types/student"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateStudentDetails } from "@/lib/actions/student"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"

interface EditStudentDialogProps {
  student: completeStudentDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedStudent: completeStudentDetails) => void
}

export function EditStudentDialog({ student, open, onOpenChange, onSuccess }: EditStudentDialogProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Student form state
  const [formData, setFormData] = useState({
    name: student.name,
    address: student.address || "",
    dateOfBirth: new Date(student.dateOfBirth),
    fatherName: student.fatherName || "",
    fatherPhone: student.fatherPhone || "",
    motherName: student.motherName || "",
    motherPhone: student.motherPhone || "",
    isActive: student.isActive,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      const requiredFields = ["name", "fatherName", "motherName"]
      const errors: Record<string, string> = {}

      requiredFields.forEach((field) => {
        if (!formData[field as keyof typeof formData]) {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")} is required`
        }
      })

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(updateStudentDetails(student.id, formData), {
        loading: "Updating student...",
        success: (result) => {
          if (result?.status === "SUCCESS" && result.data) {
            onOpenChange(false)
            if (onSuccess) {
              onSuccess(result.data)
            }
            return "Student updated successfully"
          } else {
            throw new Error(result?.message || "Failed to update student")
          }
        },
        error: (error) => {
          console.error("Error updating student:", error)
          return "An error occurred while updating student"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error updating student:", error)
      toast.error("An error occurred while updating student")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update the student details.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="parents">Parents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Student's full name"
                      required
                    />
                    {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Student's address"
                    />
                    {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <EnhancedCalendar
                      selected={formData.dateOfBirth}
                      onSelect={(date) => date && setFormData((prev) => ({ ...prev, dateOfBirth: date }))}
                    />
                    {formErrors.dateOfBirth && <p className="text-sm text-red-500">{formErrors.dateOfBirth}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: !!checked }))}
                    />
                    <Label htmlFor="isActive">Active Student</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setActiveTab("parents")}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Father's Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">
                      Father's Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fatherName"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      placeholder="Father's name"
                      required
                    />
                    {formErrors.fatherName && <p className="text-sm text-red-500">{formErrors.fatherName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone</Label>
                    <Input
                      id="fatherPhone"
                      name="fatherPhone"
                      value={formData.fatherPhone}
                      onChange={handleInputChange}
                      placeholder="Father's phone number"
                    />
                    {formErrors.fatherPhone && <p className="text-sm text-red-500">{formErrors.fatherPhone}</p>}
                  </div>

                  <h3 className="text-lg font-medium mt-6">Mother's Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">
                      Mother's Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="motherName"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      placeholder="Mother's name"
                      required
                    />
                    {formErrors.motherName && <p className="text-sm text-red-500">{formErrors.motherName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherPhone">Mother's Phone</Label>
                    <Input
                      id="motherPhone"
                      name="motherPhone"
                      value={formData.motherPhone}
                      onChange={handleInputChange}
                      placeholder="Mother's phone number"
                    />
                    {formErrors.motherPhone && <p className="text-sm text-red-500">{formErrors.motherPhone}</p>}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Student"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
