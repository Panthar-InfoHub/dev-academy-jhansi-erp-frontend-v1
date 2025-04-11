"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { searchEmployees, deleteEmployee, updateEmployee } from "@/lib/actions/employee"
import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Ban,
  UserX,
  CheckCircle,
  UserCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null)
  const [employeeToDisable, setEmployeeToDisable] = useState<string | null>(null)
  const [employeeToEnable, setEmployeeToEnable] = useState<string | null>(null)
  const [employeeToFire, setEmployeeToFire] = useState<string | null>(null)
  const [employeeToUnfire, setEmployeeToUnfire] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

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
    router.push(`/dashboard/employees/${employeeId}`)
  }

  const handleCopyId = (employeeId: string) => {
    navigator.clipboard.writeText(employeeId)
    toast.success("Employee ID copied to clipboard")
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setIsActionLoading(true)
    try {
      const result = await deleteEmployee(employeeToDelete)
      if (result?.status === "SUCCESS") {
        toast.success("Employee deleted successfully")
        fetchEmployees()
      } else {
        toast.error(result?.message || "Failed to delete employee")
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast.error("An error occurred while deleting employee")
    } finally {
      setIsActionLoading(false)
      setEmployeeToDelete(null)
    }
  }

  const handleDisableEmployee = async () => {
    if (!employeeToDisable) return

    setIsActionLoading(true)
    try {
      const result = await updateEmployee({
        id: employeeToDisable,
        isActive: false,
      })
      if (result?.status === "SUCCESS") {
        toast.success("Employee disabled successfully")
        fetchEmployees()
      } else {
        toast.error(result?.message || "Failed to disable employee")
      }
    } catch (error) {
      console.error("Error disabling employee:", error)
      toast.error("An error occurred while disabling employee")
    } finally {
      setIsActionLoading(false)
      setEmployeeToDisable(null)
    }
  }

  const handleEnableEmployee = async () => {
    if (!employeeToEnable) return

    setIsActionLoading(true)
    try {
      const result = await updateEmployee({
        id: employeeToEnable,
        isActive: true,
      })
      if (result?.status === "SUCCESS") {
        toast.success("Employee enabled successfully")
        fetchEmployees()
      } else {
        toast.error(result?.message || "Failed to enable employee")
      }
    } catch (error) {
      console.error("Error enabling employee:", error)
      toast.error("An error occurred while enabling employee")
    } finally {
      setIsActionLoading(false)
      setEmployeeToEnable(null)
    }
  }

  const handleFireEmployee = async () => {
    if (!employeeToFire) return

    setIsActionLoading(true)
    try {
      const result = await updateEmployee({
        id: employeeToFire,
        isFired: true,
        isActive: false, // Also disable the account when firing
      })
      if (result?.status === "SUCCESS") {
        toast.success("Employee fired successfully")
        fetchEmployees()
      } else {
        toast.error(result?.message || "Failed to fire employee")
      }
    } catch (error) {
      console.error("Error firing employee:", error)
      toast.error("An error occurred while firing employee")
    } finally {
      setIsActionLoading(false)
      setEmployeeToFire(null)
    }
  }

  const handleUnfireEmployee = async () => {
    if (!employeeToUnfire) return

    setIsActionLoading(true)
    try {
      const result = await updateEmployee({
        id: employeeToUnfire,
        isFired: false,
        isActive: true, // Also enable the account when unfiring
      })
      if (result?.status === "SUCCESS") {
        toast.success("Employee reinstated successfully")
        fetchEmployees()
      } else {
        toast.error(result?.message || "Failed to reinstate employee")
      }
    } catch (error) {
      console.error("Error unfiring employee:", error)
      toast.error("An error occurred while reinstating employee")
    } finally {
      setIsActionLoading(false)
      setEmployeeToUnfire(null)
    }
  }

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 8) return id
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <form onSubmit={handleSearch} className="flex w-full sm:w-1/2 gap-2">
            <Input
              placeholder="Search employees..."
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
            <Button variant="outline" onClick={fetchEmployees} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCopyId(employee.id)}
                  >
                    <TableCell>{employee.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(employee.dateOfBirth), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{employee.workRole}</TableCell>
                    <TableCell className="hidden sm:table-cell">{employee.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{employee.phone || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{truncateId(employee.id)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyId(employee.id)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
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
                              handleViewEmployee(employee.id)
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyId(employee.id)
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>

                          {employee.isActive ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToDisable(employee.id)
                              }}
                              className="text-amber-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToEnable(employee.id)
                              }}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                            </DropdownMenuItem>
                          )}

                          {employee.isFired ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToUnfire(employee.id)
                              }}
                              className="text-green-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reinstate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToFire(employee.id)
                              }}
                              className="text-orange-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Fire
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmployeeToDelete(employee.id)
                            }}
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
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

      {/* Delete Employee Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={isActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Employee Dialog */}
      <AlertDialog open={!!employeeToDisable} onOpenChange={(open) => !open && setEmployeeToDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to disable this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the employee from accessing the system. You can re-enable them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableEmployee}
              disabled={isActionLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable Employee Dialog */}
      <AlertDialog open={!!employeeToEnable} onOpenChange={(open) => !open && setEmployeeToEnable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to enable this employee?</AlertDialogTitle>
            <AlertDialogDescription>This will allow the employee to access the system again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnableEmployee}
              disabled={isActionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fire Employee Dialog */}
      <AlertDialog open={!!employeeToFire} onOpenChange={(open) => !open && setEmployeeToFire(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to fire this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the employee as fired in the system and disable their account. This action can be reversed
              by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFireEmployee}
              disabled={isActionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Fire Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfire Employee Dialog */}
      <AlertDialog open={!!employeeToUnfire} onOpenChange={(open) => !open && setEmployeeToUnfire(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reinstate this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the fired status from the employee and enable their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfireEmployee}
              disabled={isActionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reinstate Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
