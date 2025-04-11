"use client"

import { Badge } from "@/components/ui/badge"

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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { updateExamEntry } from "@/lib/actions/student"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { examEntry, examEntrySubject } from "@/types/student"

interface UpdateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  enrollmentId: string
  exam: examEntry | null
  onSuccess?: () => void
}

export function UpdateExamDialog({
  open,
  onOpenChange,
  studentId,
  enrollmentId,
  exam,
  onSuccess,
}: UpdateExamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("details")

  // Form state
  const [formData, setFormData] = useState({
    examName: "",
    examType: "",
    examDate: new Date(),
    note: "",
    studentPassed: false,
    subjects: [] as examEntrySubject[],
  })

  // Reset form when exam changes
  useEffect(() => {
    if (exam) {
      setFormData({
        examName: exam.examName,
        examType: exam.examType,
        examDate: new Date(exam.examDate),
        note: exam.note || "",
        studentPassed: exam.studentPassed || false,
        subjects: exam.subjects || [],
      })
    }
  }, [exam])

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

  const handleSubjectMarksChange = (subjectIndex: number, field: keyof examEntrySubject, value: any) => {
    setFormData((prev) => {
      const updatedSubjects = [...prev.subjects]
      updatedSubjects[subjectIndex] = {
        ...updatedSubjects[subjectIndex],
        [field]: typeof value === "string" ? Number(value) || null : value,
      }

      // Calculate total marks
      if (
        field === "obtainedMarksTheory" ||
        field === "obtainedMarksPractical" ||
        field === "totalMarksTheory" ||
        field === "totalMarksPractical"
      ) {
        const subject = updatedSubjects[subjectIndex]
        let totalMarks = 0

        // Add theory marks if applicable
        if (subject.theoryExam) {
          totalMarks += subject.totalMarksTheory || 0
        }

        // Add practical marks if applicable
        if (subject.practicalExam) {
          totalMarks += subject.totalMarksPractical || 0
        }

        updatedSubjects[subjectIndex].totalMarks = totalMarks
      }

      return {
        ...prev,
        subjects: updatedSubjects,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exam) return

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

      // Validate subject marks
      formData.subjects.forEach((subject, index) => {
        if (subject.theoryExam) {
          if (subject.obtainedMarksTheory === null || subject.obtainedMarksTheory === undefined) {
            errors[`subject-${index}-theory-obtained`] = `Theory marks required for ${subject.name}`
          }
          if (subject.totalMarksTheory === null || subject.totalMarksTheory === undefined) {
            errors[`subject-${index}-theory-total`] = `Total theory marks required for ${subject.name}`
          }
          if (subject.obtainedMarksTheory > subject.totalMarksTheory) {
            errors[`subject-${index}-theory-exceed`] = `Obtained marks cannot exceed total marks for ${subject.name}`
          }
        }

        if (subject.practicalExam) {
          if (subject.obtainedMarksPractical === null || subject.obtainedMarksPractical === undefined) {
            errors[`subject-${index}-practical-obtained`] = `Practical marks required for ${subject.name}`
          }
          if (subject.totalMarksPractical === null || subject.totalMarksPractical === undefined) {
            errors[`subject-${index}-practical-total`] = `Total practical marks required for ${subject.name}`
          }
          if (subject.obtainedMarksPractical > subject.totalMarksPractical) {
            errors[`subject-${index}-practical-exceed`] = `Obtained marks cannot exceed total marks for ${subject.name}`
          }
        }
      })

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      console.log("Updating exam with data:", formData)

      toast.promise(updateExamEntry(studentId, enrollmentId, exam.examEntryId, formData), {
        loading: "Updating exam entry...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)

            if (onSuccess) {
              onSuccess()
            }
            return "Exam entry updated successfully"
          } else {
            throw new Error(result?.message || "Failed to update exam entry")
          }
        },
        error: (error) => {
          console.error("Error updating exam entry:", error)
          return error.message || "An error occurred while updating exam entry"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error updating exam entry:", error)
      toast.error("An error occurred while updating exam entry")
      setIsSubmitting(false)
    }
  }

  if (!exam) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Update Exam</DialogTitle>
          <DialogDescription>Update exam details and subject marks.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Exam Details</TabsTrigger>
            <TabsTrigger value="subjects">Subject Marks</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[60vh] pr-4 mt-4">
            <form onSubmit={handleSubmit}>
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="examName">
                    Exam Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="examName"
                    name="examName"
                    value={formData.examName}
                    onChange={handleInputChange}
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

                <div className="space-y-2">
                  <Label htmlFor="note">Term</Label>
                  <Input
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="e.g., Term I, Term II"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="studentPassed"
                    checked={formData.studentPassed}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, studentPassed: !!checked }))}
                  />
                  <Label htmlFor="studentPassed">Student Passed</Label>
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-6">
                {formData.subjects.length > 0 ? (
                  formData.subjects.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{subject.name}</h3>
                        <Badge variant="outline">{subject.code}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {subject.theoryExam && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`theory-obtained-${index}`}>Obtained Marks (Theory)</Label>
                              <Input
                                id={`theory-obtained-${index}`}
                                type="number"
                                value={subject.obtainedMarksTheory || ""}
                                onChange={(e) => handleSubjectMarksChange(index, "obtainedMarksTheory", e.target.value)}
                                min="0"
                              />
                              {formErrors[`subject-${index}-theory-obtained`] && (
                                <p className="text-sm text-red-500">{formErrors[`subject-${index}-theory-obtained`]}</p>
                              )}
                              {formErrors[`subject-${index}-theory-exceed`] && (
                                <p className="text-sm text-red-500">{formErrors[`subject-${index}-theory-exceed`]}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`theory-total-${index}`}>Total Marks (Theory)</Label>
                              <Input
                                id={`theory-total-${index}`}
                                type="number"
                                value={subject.totalMarksTheory || ""}
                                onChange={(e) => handleSubjectMarksChange(index, "totalMarksTheory", e.target.value)}
                                min="0"
                              />
                              {formErrors[`subject-${index}-theory-total`] && (
                                <p className="text-sm text-red-500">{formErrors[`subject-${index}-theory-total`]}</p>
                              )}
                            </div>
                          </>
                        )}

                        {subject.practicalExam && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor={`practical-obtained-${index}`}>Obtained Marks (Practical)</Label>
                              <Input
                                id={`practical-obtained-${index}`}
                                type="number"
                                value={subject.obtainedMarksPractical || ""}
                                onChange={(e) =>
                                  handleSubjectMarksChange(index, "obtainedMarksPractical", e.target.value)
                                }
                                min="0"
                              />
                              {formErrors[`subject-${index}-practical-obtained`] && (
                                <p className="text-sm text-red-500">
                                  {formErrors[`subject-${index}-practical-obtained`]}
                                </p>
                              )}
                              {formErrors[`subject-${index}-practical-exceed`] && (
                                <p className="text-sm text-red-500">
                                  {formErrors[`subject-${index}-practical-exceed`]}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`practical-total-${index}`}>Total Marks (Practical)</Label>
                              <Input
                                id={`practical-total-${index}`}
                                type="number"
                                value={subject.totalMarksPractical || ""}
                                onChange={(e) => handleSubjectMarksChange(index, "totalMarksPractical", e.target.value)}
                                min="0"
                              />
                              {formErrors[`subject-${index}-practical-total`] && (
                                <p className="text-sm text-red-500">{formErrors[`subject-${index}-practical-total`]}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-center">
                          <Label>Total Marks</Label>
                          <span className="font-medium">{subject.totalMarks || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No subjects found for this exam</p>
                )}
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Exam"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
