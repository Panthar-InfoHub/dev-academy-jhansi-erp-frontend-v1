"use client"

import React, { useEffect } from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Copy, ExternalLink, MoreHorizontal, RefreshCw, Search, Trash2 } from "lucide-react"
import { searchStudents, deleteStudent } from "@/lib/actions/student"
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

export function StudentsSearchTable() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 12) return id
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setIsLoading(true)
    setStudents([])

    try {
      const result = await searchStudents(searchQuery, page, limit, false)

      if (result?.status === "SUCCESS" && result.data) {
        setStudents(result.data.students || [])
        setTotalCount(result.data.total || 0)
        toast.success(`Found ${result.data.students?.length || 0} students`)
      } else {
        toast.error(result?.message || "Failed to search students")
      }
    } catch (error) {
      console.error("Error searching students:", error)
      toast.error("An error occurred while searching students")
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
          setStudents((prev) => prev.filter((student) => student.id !== studentToDelete))
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    handleSearch()
  }
  
  useEffect(() => {
    void handleSearch()
  }, [])

  return (
    <Card>
      <CardHeader>{/* Title removed as requested */}</CardHeader>
      <CardContent>
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by name, father's name, mother's name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>

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
                  <TableHead>Status</TableHead>
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
                      {searchQuery
                        ? "No students found. Try a different search term."
                        : "Enter a search term to find students."}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono">{truncateId(student.id)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyId(student.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        {student.createdAt ? format(new Date(student.createdAt), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {student.dateOfBirth ? format(new Date(student.dateOfBirth), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>{student.fatherName || "N/A"}</TableCell>
                      <TableCell>{student.motherName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={student.isActive ? "default" : "outline"}>
                          {student.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewStudent(student.id)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStudentToDelete(student.id)} className="text-red-600">
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

          {totalCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {students.length} of {totalCount} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {Math.ceil(totalCount / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(totalCount / limit) || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
    </Card>
  )
}
