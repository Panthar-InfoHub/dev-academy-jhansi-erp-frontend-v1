"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Ban,
  CheckCircle,
  Copy,
  FileText,
  BookOpen,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react"
import {
  updateClassroom,
  deleteClassroom,
  createClassroomSection,
  updateClassroomSection,
  deleteClassroomSection,
  getClassroomStudentsInfo,
  getClassroomSectionStudentsInfo,
} from "@/lib/actions/classroom"
import type { completeClassDetails, completeClassSectionDetails, subject } from "@/types/classroom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { updateClassroomSchema, createSectionSchema, updateSectionSchema } from "@/lib/validation/classroom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ClassroomDetailProps {
  classroom: completeClassDetails
  sections: completeClassSectionDetails[]
}

export function ClassroomDetail({ classroom, sections: initialSections }: ClassroomDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false)
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false)
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedSection, setSelectedSection] = useState<completeClassSectionDetails | null>(null)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  const [sectionToToggle, setSectionToToggle] = useState<{ id: string; isActive: boolean } | null>(null)
  const [sections, setSections] = useState<completeClassSectionDetails[]>(initialSections || [])

  // Student data state
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [classStudents, setClassStudents] = useState<any[]>([])
  const [sectionStudents, setSectionStudents] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>(getCurrentSession())
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Edit classroom form state
  const [editClassroom, setEditClassroom] = useState({
    name: classroom.name,
    isActive: classroom.isActive,
  })

  // New section form state
  const [newSection, setNewSection] = useState({
    name: "",
    isActive: true,
    defaultFee: 0,
    subjects: [
      {
        name: "",
        code: "",
        theoryExam: true,
        practicalExam: false,
      },
    ],
  })

  // Edit section form state
  const [editSection, setEditSection] = useState({
    name: "",
    isActive: true,
    defaultFee: 0,
    subjects: [] as subject[],
  })

  // Update sections when initialSections changes
  useEffect(() => {
    if (initialSections && initialSections.length > 0) {
      setSections(initialSections)
    }
  }, [initialSections])

  // Generate session options (current year and 4 years back)
  function getSessionOptions() {
    const currentYear = new Date().getFullYear()
    const options = []

    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i
      const endYear = startYear + 1
      options.push(`${startYear}-${endYear.toString().slice(-2)}`)
    }

    return options
  }

  // Get current session (e.g., "2024-25")
  function getCurrentSession() {
    const currentYear = new Date().getFullYear()
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
  }

  // Convert session string to start and end dates
  function getSessionDates(session: string): { startPeriod: Date; endPeriod: Date } {
    const [startYear, endYearShort] = session.split("-")
    const endYear = Number.parseInt(startYear.slice(0, -2) + endYearShort)

    return {
      startPeriod: new Date(`${startYear}-04-01`), // April 1st of start year
      endPeriod: new Date(`${endYear}-03-31`), // March 31st of end year
    }
  }

  // Fetch students data based on selection
  const fetchStudents = async () => {
    if (!classroom.id) return

    setIsLoadingStudents(true)

    try {
      const { startPeriod, endPeriod } = getSessionDates(selectedSession)

      if (selectedSection) {
        // Fetch students for specific section
        const result = await getClassroomSectionStudentsInfo(classroom.id, selectedSection.id, {
          startPeriod,
          endPeriod,
          activeOnly: showActiveOnly,
        })

        if (result?.status === "SUCCESS" && result.data) {
          setSectionStudents(result.data)
        } else {
          toast.error(result?.message || "Failed to fetch section students")
          setSectionStudents([])
        }
      } else {
        // Fetch all students for the class
        const result = await getClassroomStudentsInfo(classroom.id, {
          startPeriod,
          endPeriod,
          activeOnly: showActiveOnly,
        })

        if (result?.status === "SUCCESS" && result.data) {
          setClassStudents(result.data)
        } else {
          toast.error(result?.message || "Failed to fetch class students")
          setClassStudents([])
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("An error occurred while fetching students")
    } finally {
      setIsLoadingStudents(false)
    }
  }

  // Fetch students when selection changes
  useEffect(() => {
    fetchStudents()
  }, [selectedSection, selectedSession, showActiveOnly, classroom.id])

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 12) return id
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
  }

  const handleClassInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setEditClassroom((prev) => ({
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

  const handleSectionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    if (name === "defaultFee") {
      // Convert to number or default to 0 if it's an invalid number
      const numericValue = value !== "" ? Number.parseFloat(value) : 0

      setNewSection((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
    } else {
      setNewSection((prev) => ({
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

  const handleEditSectionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    if (name === "defaultFee") {
      // Convert to number or default to 0 if it's an invalid number
      const numericValue = value !== "" ? Number.parseFloat(value) : 0

      setEditSection((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
    } else {
      setEditSection((prev) => ({
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

  const handleSubjectChange = (index: number, field: keyof subject, value: string | boolean) => {
    setNewSection((prev) => {
      const updatedSubjects = [...prev.subjects]
      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]: value,
      }
      return {
        ...prev,
        subjects: updatedSubjects,
      }
    })
  }

  const handleEditSubjectChange = (index: number, field: keyof subject, value: string | boolean) => {
    setEditSection((prev) => {
      const updatedSubjects = [...prev.subjects]
      updatedSubjects[index] = {
        ...updatedSubjects[index],
        [field]: value,
      }
      return {
        ...prev,
        subjects: updatedSubjects,
      }
    })
  }

  const addSubject = () => {
    setNewSection((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          name: "",
          code: "",
          theoryExam: true,
          practicalExam: false,
        },
      ],
    }))
  }

  const addEditSubject = () => {
    setEditSection((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          name: "",
          code: "",
          theoryExam: true,
          practicalExam: false,
        },
      ],
    }))
  }

  const removeSubject = (index: number) => {
    setNewSection((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  }

  const removeEditSubject = (index: number) => {
    setEditSection((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  }

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = updateClassroomSchema.safeParse(editClassroom)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach((err) => {
          const path = err.path[0] as string
          errors[path] = err.message
        })

        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(updateClassroom(editClassroom, classroom.id), {
        loading: "Updating class...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            setEditClassDialogOpen(false)
            router.refresh()
            return "Class updated successfully"
          } else {
            throw new Error(result?.message || "Failed to update class")
          }
        },
        error: (error) => {
          console.error("Error updating class:", error)
          return "An error occurred while updating class"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error updating class:", error)
      toast.error("An error occurred while updating class")
      setIsSubmitting(false)
    }
  }

  const handleNewSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = createSectionSchema.safeParse(newSection)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach((err) => {
          const path = err.path[0] as string
          errors[path] = err.message
        })

        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(createClassroomSection(classroom.id, newSection), {
        loading: "Creating new section...",
        success: async (result) => {
          if (result?.status === "SUCCESS") {
            setNewSectionDialogOpen(false)

            // Update local state with the new section
            if (result.data) {
              setSections((prev) => [...prev, result.data])
            }

            // Reset form
            setNewSection({
              name: "",
              isActive: true,
              defaultFee: 0,
              subjects: [
                {
                  name: "",
                  code: "",
                  theoryExam: true,
                  practicalExam: false,
                },
              ],
            })

            // Refresh the page to get updated data
            router.refresh()
            return "Section created successfully"
          } else {
            throw new Error(result?.message || "Failed to create section")
          }
        },
        error: (error) => {
          console.error("Error creating section:", error)
          return "An error occurred while creating section"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error creating section:", error)
      toast.error("An error occurred while creating section")
      setIsSubmitting(false)
    }
  }

  const handleEditSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSection) return

    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = updateSectionSchema.safeParse(editSection)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach((err) => {
          const path = err.path[0] as string
          errors[path] = err.message
        })

        setFormErrors(errors)
        setIsSubmitting(false)
        return
      }

      toast.promise(updateClassroomSection(classroom.id, selectedSection.id, editSection), {
        loading: "Updating section...",
        success: async (result) => {
          if (result?.status === "SUCCESS") {
            setEditSectionDialogOpen(false)

            // Update local state
            if (result.data) {
              setSections((prev) => prev.map((section) => (section.id === selectedSection.id ? result.data : section)))

              // Update selected section if it was the one being edited
              if (selectedSection.id === result.data.id) {
                setSelectedSection(result.data)
              }
            }

            router.refresh()
            return "Section updated successfully"
          } else {
            throw new Error(result?.message || "Failed to update section")
          }
        },
        error: (error) => {
          console.error("Error updating section:", error)
          return "An error occurred while updating section"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("An error occurred while updating section")
      setIsSubmitting(false)
    }
  }

  const handleDeleteClass = async () => {
    setIsDeleting(true)

    toast.promise(deleteClassroom(classroom.id), {
      loading: "Deleting class...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push("/dashboard/class")
          return "Class deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete class")
        }
      },
      error: (error) => {
        console.error("Error deleting class:", error)
        return "An error occurred while deleting class"
      },
      finally: () => {
        setIsDeleting(false)
        setDeleteDialogOpen(false)
      },
    })
  }

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return

    toast.promise(deleteClassroomSection(classroom.id, sectionToDelete), {
      loading: "Deleting section...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          // Update local state
          setSections((prev) => prev.filter((section) => section.id !== sectionToDelete))
          setSectionToDelete(null)

          // If the deleted section was selected, clear selection
          if (selectedSection && selectedSection.id === sectionToDelete) {
            setSelectedSection(null)
            setActiveTab("overview")
          }

          router.refresh()
          return "Section deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete section")
        }
      },
      error: (error) => {
        console.error("Error deleting section:", error)
        return "An error occurred while deleting section"
      },
    })
  }

  const handleToggleSectionStatus = async () => {
    if (!sectionToToggle) return

    toast.promise(updateClassroomSection(classroom.id, sectionToToggle.id, { isActive: !sectionToToggle.isActive }), {
      loading: `${sectionToToggle.isActive ? "Disabling" : "Enabling"} section...`,
      success: (result) => {
        if (result?.status === "SUCCESS") {
          // Update local state
          if (result.data) {
            setSections((prev) => prev.map((section) => (section.id === sectionToToggle.id ? result.data : section)))

            // Update selected section if it was the one toggled
            if (selectedSection && selectedSection.id === sectionToToggle.id) {
              setSelectedSection(result.data)
            }
          }

          setSectionToToggle(null)
          router.refresh()
          return `Section ${sectionToToggle.isActive ? "disabled" : "enabled"} successfully`
        } else {
          throw new Error(result?.message || `Failed to ${sectionToToggle.isActive ? "disable" : "enable"} section`)
        }
      },
      error: (error) => {
        console.error(`Error ${sectionToToggle.isActive ? "disabling" : "enabling"} section:`, error)
        return `An error occurred while ${sectionToToggle.isActive ? "disabling" : "enabling"} section`
      },
    })
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("ID copied to clipboard")
  }

  const handleSelectSection = (section: completeClassSectionDetails) => {
    setSelectedSection(section)
    setActiveTab("section-details")
  }

  const handleEditSection = (section: completeClassSectionDetails) => {
    setSelectedSection(section)
    setEditSection({
      name: section.name,
      isActive: section.isActive,
      defaultFee: section.defaultFee,
      subjects: [...(section.subjects || [])], // Create a deep copy of subjects
    })
    setEditSectionDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/class")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Button>

        <div className="flex gap-2">
          <Dialog open={editClassDialogOpen} onOpenChange={setEditClassDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
                <DialogDescription>Update the class details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleClassSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Class Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={editClassroom.name}
                      onChange={handleClassInputChange}
                      className="col-span-3"
                      required
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.name}</p>
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
                        checked={editClassroom.isActive}
                        onChange={handleClassInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
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

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Class
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this class?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the class and all associated data. If
                  students are enrolled in this class, consider disabling it instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteClass}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{classroom.name}</h1>
              <Badge variant={classroom.isActive ? "default" : "outline"}>
                {classroom.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">ID: {truncateId(classroom.id)}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(classroom.id)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Dialog open={newSectionDialogOpen} onOpenChange={setNewSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Section
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
                <DialogDescription>Enter the details to create a new section for {classroom.name}.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <form onSubmit={handleNewSectionSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="sm:text-right">
                        Section Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={newSection.name}
                        onChange={handleSectionInputChange}
                        className="sm:col-span-3"
                        placeholder="e.g., A, B, etc."
                        required
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500 sm:col-start-2 sm:col-span-3">{formErrors.name}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="defaultFee" className="sm:text-right">
                        Default Fee
                      </Label>
                      <Input
                        id="defaultFee"
                        name="defaultFee"
                        type="number"
                        value={newSection.defaultFee}
                        onChange={handleSectionInputChange}
                        className="sm:col-span-3"
                        min="0"
                        max="10000000"
                        required
                      />
                      {formErrors.defaultFee && (
                        <p className="text-sm text-red-500 sm:col-start-2 sm:col-span-3">{formErrors.defaultFee}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="isActive" className="sm:text-right">
                        Active
                      </Label>
                      <div className="sm:col-span-3 flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={newSection.isActive}
                          onChange={handleSectionInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="col-span-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Subjects</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addSubject}>
                          <Plus className="h-4 w-4 mr-1" /> Add Subject
                        </Button>
                      </div>
                      {formErrors.subjects && <p className="text-sm text-red-500 mb-2">{formErrors.subjects}</p>}
                      {newSection.subjects.map((subject, index) => (
                        <div key={index} className="border rounded-md p-4 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Subject {index + 1}</h4>
                            {newSection.subjects.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubject(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`subject-name-${index}`}>Name</Label>
                              <Input
                                id={`subject-name-${index}`}
                                value={subject.name}
                                onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
                                placeholder="e.g., Mathematics"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`subject-code-${index}`}>Code</Label>
                              <Input
                                id={`subject-code-${index}`}
                                value={subject.code}
                                onChange={(e) => handleSubjectChange(index, "code", e.target.value)}
                                placeholder="e.g., MATH"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 mt-2">
                              <div className="flex items-center gap-2 mr-4">
                                <input
                                  type="checkbox"
                                  id={`theory-exam-${index}`}
                                  checked={subject.theoryExam}
                                  onChange={(e) => handleSubjectChange(index, "theoryExam", e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor={`theory-exam-${index}`}>Theory Exam</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`practical-exam-${index}`}
                                  checked={subject.practicalExam}
                                  onChange={(e) => handleSubjectChange(index, "practicalExam", e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor={`practical-exam-${index}`}>Practical Exam</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Section"}
                    </Button>
                  </DialogFooter>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.length === 0 ? (
                <p className="text-muted-foreground">No sections found</p>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                      selectedSection?.id === section.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelectSection(section)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{section.name}</span>
                        <span className="text-xs text-muted-foreground">{section.subjects?.length || 0} subjects</span>
                      </div>
                    </div>
                    <Badge variant={section.isActive ? "default" : "outline"} className="ml-2">
                      {section.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-2" onClick={() => setNewSectionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Class Overview</TabsTrigger>
              <TabsTrigger value="section-details" disabled={!selectedSection}>
                Section Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-right">{classroom.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <div className="text-right">
                      <Badge variant={classroom.isActive ? "default" : "outline"}>
                        {classroom.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Total Sections</span>
                    <span className="font-medium text-right">{sections.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">ID</span>
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium truncate max-w-[150px]" title={classroom.id}>
                        {truncateId(classroom.id)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleCopyId(classroom.id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sections Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {sections.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No sections found for this class</p>
                      <Button onClick={() => setNewSectionDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Default Fee</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sections.map((section) => (
                            <TableRow key={section.id}>
                              <TableCell className="font-medium">{section.name}</TableCell>
                              <TableCell>
                                <Badge variant={section.isActive ? "default" : "outline"}>
                                  {section.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>₹{section.defaultFee}</TableCell>
                              <TableCell>{section.subjects?.length || 0}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSelectSection(section)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditSection(section)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    {section.isActive ? (
                                      <DropdownMenuItem
                                        onClick={() => setSectionToToggle({ id: section.id, isActive: true })}
                                        className="text-amber-600"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Disable
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => setSectionToToggle({ id: section.id, isActive: false })}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Enable
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => setSectionToDelete(section.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section-details" className="mt-4 space-y-4">
              {selectedSection && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{selectedSection.name}</h2>
                      <Badge variant={selectedSection.isActive ? "default" : "outline"}>
                        {selectedSection.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleEditSection(selectedSection)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Section
                      </Button>
                      {selectedSection.isActive ? (
                        <Button
                          variant="outline"
                          className="text-amber-600"
                          onClick={() => setSectionToToggle({ id: selectedSection.id, isActive: true })}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Disable
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="text-green-600"
                          onClick={() => setSectionToToggle({ id: selectedSection.id, isActive: false })}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enable
                        </Button>
                      )}
                      <Button variant="destructive" onClick={() => setSectionToDelete(selectedSection.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Default Fee</span>
                          <span className="font-medium text-right">₹{selectedSection.defaultFee}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Total Subjects</span>
                          <span className="font-medium text-right">{selectedSection.subjects?.length || 0}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">ID</span>
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium truncate max-w-[150px]" title={selectedSection.id}>
                              {truncateId(selectedSection.id)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleCopyId(selectedSection.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Class Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Class</span>
                          <span className="font-medium text-right">{classroom.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-muted-foreground">Class Status</span>
                          <div className="text-right">
                            <Badge variant={classroom.isActive ? "default" : "outline"}>
                              {classroom.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedSection.subjects || selectedSection.subjects.length === 0 ? (
                        <p className="text-muted-foreground">No subjects found for this section</p>
                      ) : (
                        <div className="space-y-4">
                          {selectedSection.subjects.map((subject, index) => (
                            <div key={index} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                  <h3 className="text-lg font-medium">{subject.name}</h3>
                                </div>
                                <Badge variant="outline">{subject.code}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <Badge variant={subject.theoryExam ? "default" : "outline"} className="bg-blue-500">
                                  Theory Exam
                                </Badge>
                                <Badge variant={subject.practicalExam ? "default" : "outline"} className="bg-green-500">
                                  Practical Exam
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Students Section - Always visible */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>{selectedSection ? `Students in ${selectedSection.name}` : "All Students in Class"}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSessionOptions().map((session) => (
                      <SelectItem key={session} value={session}>
                        {session}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activeOnly"
                    checked={showActiveOnly}
                    onCheckedChange={(checked) => setShowActiveOnly(checked as boolean)}
                  />
                  <label
                    htmlFor="activeOnly"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Active only
                  </label>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchStudents} disabled={isLoadingStudents}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStudents ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedSection ? (
            // Section students table
            sectionStudents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No students found in this section for the selected session</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Monthly Fee</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">{truncateId(student.studentId)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyId(student.studentId)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.student?.name || "Unknown"}</TableCell>
                        <TableCell>₹{student.monthlyFee}</TableCell>
                        <TableCell>
                          {student.feeDueTotal > 0 ? (
                            <span className="text-red-500 font-medium">₹{student.feeDueTotal}</span>
                          ) : (
                            <span className="text-green-500 font-medium">₹0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.feeCompletelyPaid ? "default" : "destructive"}>
                            {student.feeCompletelyPaid ? "Paid" : "Due"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`/dashboard/student/${student.studentId}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : // Class students table
          classStudents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No students found in this class for the selected session</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono">{truncateId(student.studentId)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyId(student.studentId)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{student.student?.name || "Unknown"}</TableCell>
                      <TableCell>{student.classSection?.name || "N/A"}</TableCell>
                      <TableCell>₹{student.monthlyFee}</TableCell>
                      <TableCell>
                        {student.feeDueTotal > 0 ? (
                          <span className="text-red-500 font-medium">₹{student.feeDueTotal}</span>
                        ) : (
                          <span className="text-green-500 font-medium">₹0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.feeCompletelyPaid ? "default" : "destructive"}>
                          {student.feeCompletelyPaid ? "Paid" : "Due"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`/dashboard/student/${student.studentId}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Section Dialog */}
      <Dialog open={editSectionDialogOpen} onOpenChange={setEditSectionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update the section details.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <form onSubmit={handleEditSectionSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid sm:grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="sm:text-right">
                    Section Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={editSection.name}
                    onChange={handleEditSectionInputChange}
                    className="sm:col-span-3"
                    required
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 sm:col-start-2 sm:col-span-3">{formErrors.name}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-defaultFee" className="sm:text-right">
                    Default Fee
                  </Label>
                  <Input
                    id="edit-defaultFee"
                    name="defaultFee"
                    type="number"
                    value={editSection.defaultFee}
                    onChange={handleEditSectionInputChange}
                    className="sm:col-span-3"
                    min="0"
                    max="10000000"
                    required
                  />
                  {formErrors.defaultFee && (
                    <p className="text-sm text-red-500 sm:col-start-2 sm:col-span-3">{formErrors.defaultFee}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-isActive" className="sm:text-right">
                    Active
                  </Label>
                  <div className="sm:col-span-3 flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isActive"
                      name="isActive"
                      checked={editSection.isActive}
                      onChange={handleEditSectionInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="col-span-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Subjects</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addEditSubject}>
                      <Plus className="h-4 w-4 mr-1" /> Add Subject
                    </Button>
                  </div>
                  {formErrors.subjects && <p className="text-sm text-red-500 mb-2">{formErrors.subjects}</p>}
                  {editSection.subjects.map((subject, index) => (
                    <div key={index} className="border rounded-md p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Subject {index + 1}</h4>
                        {editSection.subjects.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEditSubject(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-subject-name-${index}`}>Name</Label>
                          <Input
                            id={`edit-subject-name-${index}`}
                            value={subject.name}
                            onChange={(e) => handleEditSubjectChange(index, "name", e.target.value)}
                            placeholder="e.g., Mathematics"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-subject-code-${index}`}>Code</Label>
                          <Input
                            id={`edit-subject-code-${index}`}
                            value={subject.code}
                            onChange={(e) => handleEditSubjectChange(index, "code", e.target.value)}
                            placeholder="e.g., MATH"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 mt-2">
                          <div className="flex items-center gap-2 mr-4">
                            <input
                              type="checkbox"
                              id={`edit-theory-exam-${index}`}
                              checked={subject.theoryExam}
                              onChange={(e) => handleEditSubjectChange(index, "theoryExam", e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`edit-theory-exam-${index}`}>Theory Exam</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`edit-practical-exam-${index}`}
                              checked={subject.practicalExam}
                              onChange={(e) => handleEditSubjectChange(index, "practicalExam", e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`edit-practical-exam-${index}`}>Practical Exam</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Section Dialog */}
      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section and all associated data. If
              students are enrolled in this section, consider disabling it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Section Status Dialog */}
      <AlertDialog open={!!sectionToToggle} onOpenChange={(open) => !open && setSectionToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to {sectionToToggle?.isActive ? "disable" : "enable"} this section?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sectionToToggle?.isActive
                ? "Disabling a section will prevent it from being used for new enrollments."
                : "Enabling a section will allow it to be used for new enrollments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleSectionStatus}
              className={
                sectionToToggle?.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
              }
            >
              {sectionToToggle?.isActive ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
