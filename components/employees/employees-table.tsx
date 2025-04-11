"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { searchEmployees } from "@/lib/actions/employee"
import type { completeEmployeeAttributes } from "@/types/employee"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { Loader2, MoreHorizontal, RefreshCw, Search, Copy, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmployeesTableProps {
  initialEmployees: completeEmployeeAttributes[]
  initialTotalCount: number
}

export function EmployeesTable({ initialEmployees, initialTotalCount }: EmployeesTableProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<completeEmployeeAttributes[]>(initialEmployees)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await searchEmployees(searchQuery, page, limit, false)
      if (response?.status === "SUCCESS") {
        setEmployees(response.data || [])
        setTotalCount(response.count || 0)
      } else {
        toast.error("Failed to fetch employees")
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("An error occurred while fetching employees")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [page, limit])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchEmployees()
  }

  const handleViewEmployee = (employeeId: string) => {
    window.open(`/dashboard/employees/${employeeId}`, "_blank")
  }

  const handleCopyId = (employeeId: string) => {
    navigator.clipboard.writeText(employeeId)
    toast.success("Employee ID copied to clipboard")
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <form onSubmit={handleSearch} className="flex w-full md:w-1/2 gap-2">
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchEmployees} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewEmployee(employee.id)}
                  >
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{format(new Date(employee.dateOfBirth), "MMMM d, yyyy")}</TableCell>
                    <TableCell>{employee.workRole}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone || "N/A"}</TableCell>
                    <TableCell>
                      {employee.isFired ? (
                        <Badge variant="destructive">Fired</Badge>
                      ) : employee.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyId(employee.id)
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewEmployee(employee.id)
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
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

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {employees.length} of {totalCount} employees
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
