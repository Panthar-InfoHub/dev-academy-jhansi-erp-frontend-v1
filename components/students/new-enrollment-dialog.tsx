"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { completeStudentDetails, newEnrollmentReqBody } from "@/types/student"
import type { completeClassDetails, completeClassSectionDetails } from "@/types/classroom"
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
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createStudentEnrollment } from "@/lib/actions/student"
import { getAllClassrooms, getAllSectionsOfClassroom } from "@/lib/actions/classroom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

interface NewEnrollmentDialogProps {
  student: completeStudentDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewEnrollmentDialog({ student, open, onOpenChange, onSuccess }: NewEnrollmentDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [classrooms, setClassrooms] = useState<completeClassDetails[]>([])
  const [sections, setSections] = useState<completeClassSectionDetails[]>([])
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false)
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [startDateMonth, setStartDateMonth] = useState<Date>(new Date())
  const [endDateMonth, setEndDateMonth] = useState<Date>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))

  // Enrollment form state
  const [formData, setFormData] = useState<newEnrollmentReqBody>({
    classRoomSectionId: "",
    sessionStartDate: new Date(),
    sessionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    monthlyFee: 500, // Default to 500
    isActive: true,
    one_time_fee: 500, // Default to 500
  })

  const [selectedClassId, setSelectedClassId] = useState<string>("")

  // Fetch classrooms on dialog open
  useEffect(() => {
    if (open) {
      fetchClassrooms()
    }
  }, [open])

  // Fetch sections when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId)
    } else {
      setSections([])
    }
  }, [selectedClassId])

  const fetchClassrooms = async () => {
    setIsLoadingClassrooms(true)
    try {
      const result = await getAllClassrooms()
      if (result) {
        setClassrooms(result.filter((c) => c.isActive))
      } else {
        toast.error("Failed to fetch classrooms")
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error)
      toast.error("An error occurred while fetching classrooms")
    } finally {
      setIsLoadingClassrooms(false)
    }
  }

  const fetchSections = async (classId: string) => {
    setIsLoadingSections(true)
    try {
      const result = await getAllSectionsOfClassroom(classId)
      if (result) {
        setSections(result.filter((s) => s.isActive))

        // If there's only one section, auto-select it
        if (result.length === 1) {
          setFormData((prev) => ({
            ...prev,
            classRoomSectionId: result[0].id,
            monthlyFee: result[0].defaultFee || 500,
          }))
        }
      } else {
        toast.error("Failed to fetch sections")
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("An error occurred while fetching sections")
    } finally {
      setIsLoadingSections(false)
    }
  }

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

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    // Reset section selection
    setFormData((prev) => ({
      ...prev,
      classRoomSectionId: "",
    }))
  }

  const handleSectionChange = (sectionId: string) => {
    const selectedSection = sections.find((s) => s.id === sectionId)
    setFormData((prev) => ({
      ...prev,
      classRoomSectionId: sectionId,
      monthlyFee: selectedSection ? selectedSection.defaultFee || 500 : 500,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const errors: Record<string, string> = {}

      if (!formData.classRoomSectionId) {
        errors.classRoomSectionId = "Section is required"
      }

      if (formData.monthlyFee <= 0) {
        errors.monthlyFee = "Monthly fee must be greater than 0"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(createStudentEnrollment(student.id, formData), {
        loading: "Creating enrollment...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)
            resetForm()
            router.refresh() // Refresh the student details page
            if (onSuccess) {
              onSuccess()
            }
            return "Enrollment created successfully"
          } else {
            throw new Error(result?.message || "Failed to create enrollment")
          }
        },
        error: (error) => {
          console.error("Error creating enrollment:", error)
          return "An error occurred while creating enrollment"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error creating enrollment:", error)
      toast.error("An error occurred while creating enrollment")
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      classRoomSectionId: "",
      sessionStartDate: new Date(),
      sessionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      monthlyFee: 500,
      isActive: true,
      one_time_fee: 500,
    })
    setSelectedClassId("")
    setFormErrors({})
    setStartDateMonth(new Date())
    setEndDateMonth(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Enrollment</DialogTitle>
          <DialogDescription>Create a new enrollment for {student.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class">
                Class <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedClassId} onValueChange={handleClassChange} disabled={isLoadingClassrooms}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.class && <p className="text-sm text-red-500">{formErrors.class}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">
                Section <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.classRoomSectionId}
                onValueChange={handleSectionChange}
                disabled={isLoadingSections || !selectedClassId || sections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedClassId
                        ? "Select a class first"
                        : sections.length === 0
                          ? "No sections available"
                          : "Select section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.classRoomSectionId && <p className="text-sm text-red-500">{formErrors.classRoomSectionId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionStartDate">
                  Session Start <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="sessionStartDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.sessionStartDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.sessionStartDate ? (
                        format(formData.sessionStartDate, "MMMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="flex items-center justify-between px-4 pt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setStartDateMonth(subMonths(startDateMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium">{format(startDateMonth, "MMMM yyyy")}</div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setStartDateMonth(addMonths(startDateMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      month={startDateMonth}
                      selected={formData.sessionStartDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date)
                          newDate.setDate(1)
                          setFormData((prev) => ({ ...prev, sessionStartDate: newDate }))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.sessionStartDate && <p className="text-sm text-red-500">{formErrors.sessionStartDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionEndDate">
                  Session End <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="sessionEndDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.sessionEndDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.sessionEndDate ? (
                        format(formData.sessionEndDate, "MMMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="flex items-center justify-between px-4 pt-2">
                      <Button variant="outline" size="icon" onClick={() => setEndDateMonth(subMonths(endDateMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium">{format(endDateMonth, "MMMM yyyy")}</div>
                      <Button variant="outline" size="icon" onClick={() => setEndDateMonth(addMonths(endDateMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      month={endDateMonth}
                      selected={formData.sessionEndDate}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = new Date(date)
                          // Set to last day of the month
                          newDate.setMonth(newDate.getMonth() + 1, 0)
                          setFormData((prev) => ({ ...prev, sessionEndDate: newDate }))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.sessionEndDate && <p className="text-sm text-red-500">{formErrors.sessionEndDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyFee">
                  Monthly Fee <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monthlyFee"
                  name="monthlyFee"
                  type="number"
                  value={formData.monthlyFee}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
                {formErrors.monthlyFee && <p className="text-sm text-red-500">{formErrors.monthlyFee}</p>}
              </div>

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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive">Active Enrollment</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Enrollment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
