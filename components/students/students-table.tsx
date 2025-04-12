"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Copy, ExternalLink, MoreHorizontal, RefreshCw, Search, Trash2, Calendar, Filter, School, BookOpen, Plus } from 'lucide-react'
import { getClassroomStudentsInfo, getClassroomSectionStudentsInfo } from "@/lib/actions/classroom"
import { deleteStudent, createNewStudent } from "@/lib/actions/student"
import { getAllSectionsOfClassroom } from "@/lib/actions/classroom"
import type { completeClassDetails, completeClassSectionDetails } from "@/types/classroom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { format } from "date-fns"
import { AddStudentDialog } from "@/components/students/add-student-dialog"

interface StudentsTableProps {
  initialClassrooms: completeClassDetails[]
}

export function StudentsTable({ initialClassrooms }: StudentsTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<completeClassDetails[]>(initialClassrooms)
  const [sections, setSections] = useState<completeClassSectionDetails[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [selectedSession, setSelectedSession] = useState<string>(getCurrentSession())
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false)

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

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 12) return id
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
  }

  // Handle class selection
  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    setSelectedSectionId("") // Reset section selection
    setSections([])

    if (classId) {
      try {
        const sectionsData = await getAllSectionsOfClassroom(classId)
        if (sectionsData) {
          setSections(sectionsData)
        }
      } catch (error) {
        console.error("Error fetching sections:", error)
        toast.error("Failed to fetch sections")
      }
    }
  }

  // Fetch students
  const fetchStudents = async () => {
    if (!selectedClassId) {
      toast.error("Please select a class first")
      return
    }

    setIsLoading(true)
    setStudents([])

    try {
      const { startPeriod, endPeriod } = getSessionDates(selectedSession)

      if (selectedSectionId && selectedSectionId !== "all") {
        // Fetch students for specific section
        const result = await getClassroomSectionStudentsInfo(selectedClassId, selectedSectionId, {
          startPeriod,
          endPeriod,
          activeOnly: showActiveOnly,
        })

        if (result?.status === "SUCCESS" && result.data) {
          setStudents(result.data)
          toast.success(`Found ${result.data.length} students`)
        } else {
          toast.error(result?.message || "Failed to fetch section students")
        }
      } else {
        // Fetch all students for the class
        const result = await getClassroomStudentsInfo(selectedClassId, {
          startPeriod,
          endPeriod,
          activeOnly: showActiveOnly,
        })

        if (result?.status === "SUCCESS" && result.data) {
          setStudents(result.data)
          toast.success(`Found ${result.data.length} students`)
        } else {
          toast.error(result?.message || "Failed to fetch class students")
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("An error occurred while fetching students")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Student ID copied to clipboard")
  }

  const handleViewStudent = (studentId: string) => {
    router.push(`/dashboard/student/${studentId}`)
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)

    toast.promise(deleteStudent(studentToDelete, false), {
      loading: "Deleting student...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          // Update local state
          setStudents((prev) => prev.filter((student) => student.studentId !== studentToDelete))
          setStudentToDelete(null)
          return "Student deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete student")
        }
      },
      error: (error) => {
        console.error("Error deleting student:", error)
        return "An error occurred while deleting student"
      },
      finally: () => {
        setIsDeleting(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students</CardTitle>
        <Button onClick={() => setAddStudentDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <School className="h-4 w-4" />
                Class
              </label>
              <Select value={selectedClassId} onValueChange={handleClassChange}>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Section
              </label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={!selectedClassId || sections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sections.length === 0 ? "No sections available" : "All sections"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Session
              </label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </label>
              <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                <Checkbox
                  id="activeOnly"
                  checked={showActiveOnly}
                  onCheckedChange={(checked) => setShowActiveOnly(checked as boolean)}
                />
                <label
                  htmlFor="activeOnly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Active students only
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push("/dashboard/students/search")}>
              <Search className="mr-2 h-4 w-4" />
              Advanced Search
            </Button>
            <Button onClick={fetchStudents} disabled={isLoading || !selectedClassId}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Mother's Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {selectedClassId
                        ? "No students found. Try different filters."
                        : "Please select a class and search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
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
                      <TableCell>
                        {student.student?.createdAt
                          ? format(new Date(student.student.createdAt), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {student.student?.dateOfBirth
                          ? format(new Date(student.student.dateOfBirth), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{student.student?.fatherName || "N/A"}</TableCell>
                      <TableCell>{student.student?.motherName || "N/A"}</TableCell>
                      <TableCell>{student.student?.fatherPhone || student.student?.motherPhone || "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewStudent(student.studentId)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStudentToDelete(student.studentId)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Delete Student Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={addStudentDialogOpen}
        onOpenChange={setAddStudentDialogOpen}
        onSuccess={(newStudentId) => {
          router.push(`/dashboard/student/${newStudentId}`)
        }}
      />
    </Card>
  )
}
