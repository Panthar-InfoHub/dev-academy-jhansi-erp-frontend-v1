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
import { toast } from "sonner"
import { setDateAsHoliday } from "@/lib/actions/employee"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation";

interface SetHolidayDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 onSuccess?: () => void
}

export function SetHolidayDialog({ open, onOpenChange, onSuccess }: SetHolidayDialogProps) {
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [formErrors, setFormErrors] = useState<Record<string, string>>({})
 const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const router = useRouter()
  
 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   setIsSubmitting(true)

   try {
     if (!selectedDate) {
       setFormErrors({ date: "Date is required" })
       setIsSubmitting(false)
       return
     }

     toast.promise(setDateAsHoliday(selectedDate), {
       loading: "Setting date as holiday...",
       success: (result) => {
         if (result?.status === "SUCCESS") {
           onOpenChange(false)
           if (onSuccess) onSuccess()
           return "Date set as holiday successfully"
         } else {
           throw new Error(result?.message || "Failed to set date as holiday")
         }
       },
       error: (error) => {
         console.error("Error setting date as holiday:", error)
         return "An error occurred while setting date as holiday"
       },
       finally: () => {
         setIsSubmitting(false)
         onOpenChange(false)
         router.refresh()
       },
     })
   } catch (error) {
     console.error("Error setting date as holiday:", error)
     toast.error("An error occurred while setting date as holiday")
     setIsSubmitting(false)
   }
 }

 return (
   <Dialog open={open} onOpenChange={onOpenChange}>
     <DialogContent className="sm:max-w-[425px]">
       <DialogHeader>
         <DialogTitle>Set Date as Holiday</DialogTitle>
         <DialogDescription>Select a date to mark as a holiday.</DialogDescription>
       </DialogHeader>
       <form onSubmit={handleSubmit}>
         <div className="grid gap-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="date">
               Date <span className="text-red-500">*</span>
             </Label>
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   variant={"outline"}
                   className={cn(
                     "w-full justify-start text-left font-normal",
                     !selectedDate && "text-muted-foreground",
                   )}
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0">
                 <Calendar
                   mode="single"
                   selected={selectedDate}
                   onSelect={setSelectedDate}
                   initialFocus
                 />
               </PopoverContent>
             </Popover>
             {formErrors.date && <p className="text-sm text-red-500">{formErrors.date}</p>}
           </div>
         </div>
         <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? "Setting..." : "Set as Holiday"}
           </Button>
         </DialogFooter>
       </form>
     </DialogContent>
   </Dialog>
 )
}
