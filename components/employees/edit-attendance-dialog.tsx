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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateAttendance, type UpdateAttendanceParams } from "@/lib/actions/employee"
import type { AttendanceDetailEntry } from "@/types/employee"
import { normalizeDate } from "@/lib/utils"
import { useRouter } from "next/navigation";

interface EditAttendanceDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 attendance: AttendanceDetailEntry
 onSuccess?: (data: AttendanceDetailEntry) => void
}

export function EditAttendanceDialog({ open, onOpenChange, attendance, onSuccess }: EditAttendanceDialogProps) {
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  
 // Form state
 const [formData, setFormData] = useState({
   isPresent: attendance.isPresent,
   clockInTime: attendance.clockInTime ? new Date(attendance.clockInTime) : null,
   isLeave: attendance.isLeave,
   isHoliday: attendance.isHoliday,
   isInvalid: attendance.isInvalid,
 })

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value, type, checked } = e.target
   setFormData((prev) => ({
     ...prev,
     [name]: type === "checkbox" ? checked : value,
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

 const handleClockInTimeChange = (date: Date | undefined) => {
   setFormData((prev) => ({
     ...prev,
     clockInTime: normalizeDate(date) || null,
   }))
 }

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   setIsSubmitting(true)

   try {
     // Validate required fields
     const errors: Record<string, string> = {}

     if (Object.keys(errors).length > 0) {
       setFormErrors(errors)
       setIsSubmitting(false)
       return
     }

     const params: UpdateAttendanceParams = {
       employeeId: attendance.employeeId,
       attendanceId: attendance.attendanceId,
       isPresent: formData.isPresent,
       clockInTime: formData.clockInTime,
       isLeave: formData.isLeave,
       isHoliday: formData.isHoliday,
       isInvalid: formData.isInvalid,
     }

     toast.promise(updateAttendance(params), {
       loading: "Updating attendance...",
       success: (result) => {
         if (result?.status === "SUCCESS") {
           onOpenChange(false)
           if (onSuccess) onSuccess(result.data)
           return "Attendance updated successfully"
         } else {
           throw new Error(result?.message || "Failed to update attendance")
         }
       },
       error: (error) => {
         console.error("Error updating attendance:", error)
         return "An error occurred while updating attendance"
       },
       finally: () => {
         setIsSubmitting(false)
         router.refresh()
       },
     })
   } catch (error) {
     console.error("Error updating attendance:", error)
     toast.error("An error occurred while updating attendance")
     setIsSubmitting(false)
   }
 }

 return (
   <Dialog open={open} onOpenChange={onOpenChange}>
     <DialogContent className="sm:max-w-[500px]">
       <DialogHeader>
         <DialogTitle>Edit Attendance</DialogTitle>
         <DialogDescription>Edit the attendance details for this entry.</DialogDescription>
       </DialogHeader>
       <form onSubmit={handleSubmit}>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
           <div className="flex items-center space-x-2">
             <Checkbox
               id="isPresent"
               name="isPresent"
               checked={formData.isPresent}
               onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPresent: Boolean(checked) }))}
             />
             <Label htmlFor="isPresent">Present</Label>
           </div>
           <div className="flex items-center space-x-2">
             <Checkbox
               id="isLeave"
               name="isLeave"
               checked={formData.isLeave}
               onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isLeave: Boolean(checked) }))}
             />
             <Label htmlFor="isLeave">Leave</Label>
           </div>

           <div className="flex items-center space-x-2">
             <Checkbox
               id="isHoliday"
               name="isHoliday"
               checked={formData.isHoliday}
               onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isHoliday: Boolean(checked) }))}
             />
             <Label htmlFor="isHoliday">Holiday</Label>
           </div>

           <div className="flex items-center space-x-2">
             <Checkbox
               id="isInvalid"
               name="isInvalid"
               checked={formData.isInvalid}
               onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isInvalid: Boolean(checked) }))}
             />
             <Label htmlFor="isInvalid">Invalid</Label>
           </div>
         </div>
         <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? "Updating..." : "Update Attendance"}
           </Button>
         </DialogFooter>
       </form>
     </DialogContent>
   </Dialog>
 )
}
