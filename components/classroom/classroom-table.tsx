"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Copy, ExternalLink, MoreHorizontal, Plus, RefreshCw, Search, Trash2, Ban, CheckCircle } from "lucide-react"
import { getAllClassrooms, createClassroom, updateClassroom, deleteClassroom } from "@/lib/actions/classroom"
import type { completeClassDetails } from "@/types/classroom.d"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createClassroomSchema } from "@/lib/validation/classroom"
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
import {customUser} from "@/auth";

interface ClassroomTableProps {
  initialClassrooms: completeClassDetails[]
  user: customUser
}

export function ClassroomTable({ initialClassrooms, user }: ClassroomTableProps) {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<completeClassDetails[]>(initialClassrooms)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredClassrooms, setFilteredClassrooms] = useState<completeClassDetails[]>(initialClassrooms)
  const [newClassDialogOpen, setNewClassDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [classroomToDelete, setClassroomToDelete] = useState<string | null>(null)
  const [classroomToToggle, setClassroomToToggle] = useState<{ id: string; isActive: boolean } | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // New classroom form state
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    isActive: true,
  })

  useEffect(() => {
    // Filter classrooms based on search query
    if (searchQuery.trim() === "") {
      setFilteredClassrooms(classrooms)
    } else {
      const filtered = classrooms.filter((classroom) =>
        classroom.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredClassrooms(filtered)
    }
  }, [searchQuery, classrooms])

  const fetchClassrooms = async () => {
    setIsLoading(true)
    try {
      const response = await getAllClassrooms()
      if (response) {
        setClassrooms(response)
        setFilteredClassrooms(response)
        toast.success("Classrooms loaded successfully")
      } else {
        toast.error("Failed to fetch classrooms")
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error)
      toast.error("An error occurred while fetching classrooms")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filter is already handled by the useEffect
  }

  const handleViewClassroom = (classroomId: string) => {
    router.push(`/dashboard/class/${classroomId}`)
  }

  const handleCopyId = (classroomId: string) => {
    navigator.clipboard.writeText(classroomId)
    toast.success("Classroom ID copied to clipboard")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewClassroom((prev) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = createClassroomSchema.safeParse(newClassroom)

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

      toast.promise(createClassroom(newClassroom), {
        loading: "Creating new classroom...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            setNewClassDialogOpen(false)
            setNewClassroom({
              name: "",
              isActive: true,
            })
            fetchClassrooms()
            return "Classroom created successfully"
          } else {
            throw new Error(result?.message || "Failed to create classroom")
          }
        },
        error: (error) => {
          console.error("Error creating classroom:", error)
          return "An error occurred while creating classroom"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error creating classroom:", error)
      toast.error("An error occurred while creating classroom")
      setIsSubmitting(false)
    }
  }

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) return

    setIsActionLoading(true)

    toast.promise(deleteClassroom(classroomToDelete), {
      loading: "Deleting classroom...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchClassrooms()
          return "Classroom deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete classroom")
        }
      },
      error: (error) => {
        console.error("Error deleting classroom:", error)
        return "An error occurred while deleting classroom"
      },
      finally: () => {
        setIsActionLoading(false)
        setClassroomToDelete(null)
      },
    })
  }

  const handleToggleClassroomStatus = async () => {
    if (!classroomToToggle) return

    setIsActionLoading(true)

    toast.promise(updateClassroom({ isActive: !classroomToToggle.isActive }, classroomToToggle.id), {
      loading: `${classroomToToggle.isActive ? "Disabling" : "Enabling"} classroom...`,
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchClassrooms()
          return `Classroom ${classroomToToggle.isActive ? "disabled" : "enabled"} successfully`
        } else {
          throw new Error(result?.message || `Failed to ${classroomToToggle.isActive ? "disable" : "enable"} classroom`)
        }
      },
      error: (error) => {
        console.error(`Error ${classroomToToggle.isActive ? "disabling" : "enabling"} classroom:`, error)
        return `An error occurred while ${classroomToToggle.isActive ? "disabling" : "enabling"} classroom`
      },
      finally: () => {
        setIsActionLoading(false)
        setClassroomToToggle(null)
      },
    })
  }

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 12) return id
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <form onSubmit={handleSearch} className="flex w-full sm:w-1/2 gap-2">
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchClassrooms} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Add Class Dialog */}
            <Dialog open={newClassDialogOpen} onOpenChange={setNewClassDialogOpen}>
              <DialogTrigger disabled={user.isTeacher} asChild>
                <Button>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Class</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Enter the details to create a new class.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Class Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={newClassroom.name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="e.g., Nursery, Class 1, etc."
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
                          checked={newClassroom.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Class"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>View</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClassrooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClassrooms.map((classroom) => (
                  <TableRow key={classroom.id}>
                    <TableCell className="font-medium">{classroom.name}</TableCell>
                    <TableCell>
                      <Badge variant={classroom.isActive ? "default" : "outline"}>
                        {classroom.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{classroom.classSections ? classroom.classSections.length : 0} Sections</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{truncateId(classroom.id)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyId(classroom.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                        <Button
                        variant={"outline"}
                        className={"flex items-center justify-end"}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewClassroom(classroom.id)
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger disabled={user.isTeacher} asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {classroom.isActive ? (
                            <DropdownMenuItem
                              onClick={() => setClassroomToToggle({ id: classroom.id, isActive: true })}
                              className="text-amber-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setClassroomToToggle({ id: classroom.id, isActive: false })}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setClassroomToDelete(classroom.id)} className="text-red-600">
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
      </CardContent>

      {/* Delete Classroom Dialog */}
      <AlertDialog open={!!classroomToDelete} onOpenChange={(open) => !open && setClassroomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class and all associated data. If students
              are enrolled in this class, consider disabling it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClassroom}
              disabled={isActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Classroom Status Dialog */}
      <AlertDialog open={!!classroomToToggle} onOpenChange={(open) => !open && setClassroomToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to {classroomToToggle?.isActive ? "disable" : "enable"} this class?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {classroomToToggle?.isActive
                ? "Disabling a class will prevent it from being used for new enrollments."
                : "Enabling a class will allow it to be used for new enrollments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleClassroomStatus}
              disabled={isActionLoading}
              className={
                classroomToToggle?.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
              }
            >
              {isActionLoading
                ? classroomToToggle?.isActive
                  ? "Disabling..."
                  : "Enabling..."
                : classroomToToggle?.isActive
                  ? "Disable"
                  : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
