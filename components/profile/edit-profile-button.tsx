"use client"

import type React from "react"

import { useState } from "react"
import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateEmployee } from "@/lib/actions/employee"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
// Import the EnhancedCalendar component at the top of the file
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"

interface EditProfileButtonProps {
  employee: completeEmployeeAttributes
}

export function EditProfileButton({ employee }: EditProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: employee.name,
    address: employee.address || "",
    phone: employee.phone || "",
    fatherName: employee.fatherName || "",
    fatherPhone: employee.fatherPhone || "",
    motherName: employee.motherName || "",
    motherPhone: employee.motherPhone || "",
    dateOfBirth: new Date(employee.dateOfBirth), // Add this line
  })
  const [formErrors, setFormErrors] = useState<any>(null)

  // Update the handleChange function to use String(checked) for checkbox values if needed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))

    // Clear error for this field
    if (formErrors && formErrors[name]) {
      setFormErrors((prev) => {
        if (!prev) return prev
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    toast.promise(
      updateEmployee({
        id: employee.id,
        ...formData,
      }),
      {
        loading: "Updating profile...",
        success: (result) => {
          if (result.status === "SUCCESS") {
            setOpen(false)
            // Force refresh the page to show updated data
            window.location.reload()
            return "Profile updated successfully"
          } else {
            throw new Error(result.message || "Failed to update profile")
          }
        },
        error: (error) => {
          console.error("Error updating profile:", error)
          return "An error occurred while updating profile"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your personal information. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateOfBirth" className="text-right">
                Date of Birth
              </Label>
              <div className="col-span-3">
                <EnhancedCalendar
                  selected={formData.dateOfBirth}
                  onSelect={(date) => date && setFormData((prev) => ({ ...prev, dateOfBirth: date }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fatherName" className="text-right">
                Father's Name
              </Label>
              <Input
                id="fatherName"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fatherPhone" className="text-right">
                Father's Phone
              </Label>
              <Input
                id="fatherPhone"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="motherName" className="text-right">
                Mother's Name
              </Label>
              <Input
                id="motherName"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="motherPhone" className="text-right">
                Mother's Phone
              </Label>
              <Input
                id="motherPhone"
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
