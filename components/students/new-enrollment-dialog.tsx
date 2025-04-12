"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { createStudentEnrollment } from "@/lib/actions/student"
import { getAllClassrooms, getAllSectionsOfClassroom } from "@/lib/actions/classroom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { completeClassDetails, completeClassSectionDetails } from "@/types/classroom"

interface NewEnrollmentDialogProps {
  studentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (enrollmentId: string) => void
}

export function NewEnrollmentDialog({ studentId, open, onOpenChange, onSuccess }: NewEnrollmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [classrooms, setClassrooms] = useState<completeClassDetails[]>([])
  const [sections, setSections] = useState<completeClassSectionDetails[]>([])
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false)
  const [isLoadingSections, setIsLoadingSections] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    classRoomSectionId: "",
    monthlyFee: 0,
    isActive: true,
    one_time_fee: 0,
  })

  // Date selection state using dropdowns instead of calendar
  const [dateSelections, setDateSelections] = useState({
    startMonth: new Date().getMonth().toString(),
    startYear: new Date().getFullYear().toString(),
    endMonth: new Date().getMonth().toString(),
    endYear: (new Date().getFullYear() + 1).toString(),
  })

  const [selectedClassId, setSelectedClassId] = useState<string>("")

  // Helper function to get month names
  const getMonthNames = () => [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Helper function to get year options (current year -5 to +10)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
      years.push(i.toString())
    }
    return years
  }

  // Helper function to create date from month and year
  const createDateFromMonthYear = (month: string, year: string) => {
    console.log(`Creating date from month: ${month}, year: ${year}`)
    return new Date(Number.parseInt(year), Number.parseInt(month), 1)
  }

  useEffect(() => {
    if (open) {
      fetchClassrooms()
    }
  }, [open])

  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId)
    } else {
      setSections([])
      setFormData((prev) => ({ ...prev, classRoomSectionId: "" }))
    }
  }, [selectedClassId])

  const fetchClassrooms = async () => {
    setIsLoadingClassrooms(true)
    try {
      const response = await getAllClassrooms()
      if (response) {
        setClassrooms(response.filter((c) => c.isActive))
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error)
      toast.error("Failed to load classrooms")
    } finally {
      setIsLoadingClassrooms(false)
    }
  }

  const fetchSections = async (classroomId: string) => {
    setIsLoadingSections(true)
    try {
      const response = await getAllSectionsOfClassroom(classroomId)
      if (response) {
        setSections(response.filter((s) => s.isActive))
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("Failed to load sections")
    } finally {
      setIsLoadingSections(false)
    }
  }

  const handleSelectChange = (field: string, value: string) => {
    if (field === "classroomId") {
      setSelectedClassId(value)
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // If selecting a section, update the monthly fee based on the section's default fee
      if (field === "classRoomSectionId") {
        const section = sections.find((s) => s.id === value)
        if (section) {
          setFormData((prev) => ({ ...prev, monthlyFee: section.defaultFee }))
        }
      }
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

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

  const handleDateSelectionChange = (field: string, value: string) => {
    console.log(`Updating ${field} to ${value}`)
    setDateSelections((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create date objects from selections
      const sessionStartDate = createDateFromMonthYear(dateSelections.startMonth, dateSelections.startYear)
      const sessionEndDate = createDateFromMonthYear(dateSelections.endMonth, dateSelections.endYear)

      console.log("Session start date:", sessionStartDate)
      console.log("Session end date:", sessionEndDate)

      // Validate required fields
      const errors: Record<string, string> = {}

      if (!formData.classRoomSectionId) {
        errors.classRoomSectionId = "Section is required"
      }

      if (formData.monthlyFee < 0) {
        errors.monthlyFee = "Monthly fee cannot be negative"
      }

      if (formData.one_time_fee < 0) {
        errors.one_time_fee = "One-time fee cannot be negative"
      }

      if (sessionStartDate >= sessionEndDate) {
        errors.sessionDates = "End date must be after start date"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      // Prepare enrollment data with the created dates
      const enrollmentData = {
        ...formData,
        sessionStartDate,
        sessionEndDate,
      }

      toast.promise(createStudentEnrollment(studentId, enrollmentData), {
        loading: "Creating enrollment...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)
            if (onSuccess) onSuccess(result.data.id)
            return result.message || "Enrollment created successfully"
          } else {
            throw new Error(result?.message || "Failed to create enrollment")
          }
        },
        error: (error) => {
          console.error("Error creating enrollment:", error)
          return (error as Error).message || "An error occurred while creating enrollment"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Enrollment</DialogTitle>
          <DialogDescription>Create a new enrollment for this student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classroomId" className="text-right">
                Class
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedClassId}
                  onValueChange={(value) => handleSelectChange("classroomId", value)}
                  disabled={isLoadingClassrooms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.classroomId && <p className="text-sm text-red-500 mt-1">{formErrors.classroomId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classRoomSectionId" className="text-right">
                Section
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.classRoomSectionId}
                  onValueChange={(value) => handleSelectChange("classRoomSectionId", value)}
                  disabled={isLoadingSections || !selectedClassId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name} (Fee: ₹{section.defaultFee})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.classRoomSectionId && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.classRoomSectionId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Session Start</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select
                  value={dateSelections.startMonth}
                  onValueChange={(value) => handleDateSelectionChange("startMonth", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthNames().map((month, index) => (
                      <SelectItem key={month} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={dateSelections.startYear}
                  onValueChange={(value) => handleDateSelectionChange("startYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Session End</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select
                  value={dateSelections.endMonth}
                  onValueChange={(value) => handleDateSelectionChange("endMonth", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthNames().map((month, index) => (
                      <SelectItem key={month} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={dateSelections.endYear}
                  onValueChange={(value) => handleDateSelectionChange("endYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formErrors.sessionDates && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <p className="text-sm text-red-500">{formErrors.sessionDates}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyFee" className="text-right">
                Monthly Fee (₹)
              </Label>
              <Input
                id="monthlyFee"
                name="monthlyFee"
                type="number"
                value={formData.monthlyFee}
                onChange={handleInputChange}
                className="col-span-3"
              />
              {formErrors.monthlyFee && (
                <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.monthlyFee}</p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="one_time_fee" className="text-right">
                One-time Fee (₹)
              </Label>
              <Input
                id="one_time_fee"
                name="one_time_fee"
                type="number"
                value={formData.one_time_fee}
                onChange={handleInputChange}
                className="col-span-3"
              />
              {formErrors.one_time_fee && (
                <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.one_time_fee}</p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
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
