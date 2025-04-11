"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { searchEmployees, deleteEmployee, updateEmployee, addNewEmployee } from "@/lib/actions/employee"
import type { completeEmployeeAttributes, EmployeeAttributes, identityEntry } from "@/types/employee.d"
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
  UserPlus,
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
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createEmployeeSchema } from "@/lib/validation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface EmployeesTableProps {
  initialEmployees: completeEmployeeAttributes[]
  initialTotalCount: number
}

export function EmployeesTable({ initialEmployees, initialTotalCount }: EmployeesTableProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

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
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    dateOfBirth: new Date(),
    workRole: "",
    salary: "0",
    isActive: true,
    isFired: false,
    ids: [] as identityEntry[],
  })

  // ID document form state
  const [newIdName, setNewIdName] = useState("")
  const [newIdValue, setNewIdValue] = useState("")

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

    toast.promise(deleteEmployee(employeeToDelete), {
      loading: "Deleting employee...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          fetchEmployees()
          return "Employee deleted successfully"
        } else {
          throw new Error(result?.message || "Failed to delete employee")
        }
      },
      error: (error) => {
        console.error("Error deleting employee:", error)
        return "An error occurred while deleting employee"
      },
      finally: () => {
        setIsActionLoading(false)
        setEmployeeToDelete(null)
      },
    })
  }

  const handleDisableEmployee = async () => {
    if (!employeeToDisable) return

    setIsActionLoading(true)

    toast.promise(
      updateEmployee({
        id: employeeToDisable,
        isActive: false,
      }),
      {
        loading: "Disabling employee...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            fetchEmployees()
            return "Employee disabled successfully"
          } else {
            throw new Error(result?.message || "Failed to disable employee")
          }
        },
        error: (error) => {
          console.error("Error disabling employee:", error)
          return "An error occurred while disabling employee"
        },
        finally: () => {
          setIsActionLoading(false)
          setEmployeeToDisable(null)
        },
      },
    )
  }

  const handleEnableEmployee = async () => {
    if (!employeeToEnable) return

    setIsActionLoading(true)

    toast.promise(
      updateEmployee({
        id: employeeToEnable,
        isActive: true,
      }),
      {
        loading: "Enabling employee...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            fetchEmployees()
            return "Employee enabled successfully"
          } else {
            throw new Error(result?.message || "Failed to enable employee")
          }
        },
        error: (error) => {
          console.error("Error enabling employee:", error)
          return "An error occurred while enabling employee"
        },
        finally: () => {
          setIsActionLoading(false)
          setEmployeeToEnable(null)
        },
      },
    )
  }

  const handleFireEmployee = async () => {
    if (!employeeToFire) return

    setIsActionLoading(true)

    toast.promise(
      updateEmployee({
        id: employeeToFire,
        isFired: true,
        isActive: false, // Also disable the account when firing
      }),
      {
        loading: "Processing...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            fetchEmployees()
            return "Employee fired successfully"
          } else {
            throw new Error(result?.message || "Failed to fire employee")
          }
        },
        error: (error) => {
          console.error("Error firing employee:", error)
          return "An error occurred while firing employee"
        },
        finally: () => {
          setIsActionLoading(false)
          setEmployeeToFire(null)
        },
      },
    )
  }

  const handleUnfireEmployee = async () => {
    if (!employeeToUnfire) return

    setIsActionLoading(true)

    toast.promise(
      updateEmployee({
        id: employeeToUnfire,
        isFired: false,
        // Don't automatically enable the account when reinstating
      }),
      {
        loading: "Processing...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            fetchEmployees()
            return "Employee reinstated successfully"
          } else {
            throw new Error(result?.message || "Failed to reinstate employee")
          }
        },
        error: (error) => {
          console.error("Error unfiring employee:", error)
          return "An error occurred while reinstating employee"
        },
        finally: () => {
          setIsActionLoading(false)
          setEmployeeToUnfire(null)
        },
      },
    )
  }

  // Function to truncate ID for display
  const truncateId = (id: string) => {
    if (id.length <= 8) return id
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`
  }

  // Check if the employee is the current user
  const isCurrentUser = (employeeId: string) => {
    return employeeId === currentUserId
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewEmployee((prev) => ({
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

  const handleAddId = () => {
    if (!newIdName || !newIdValue) {
      setFormErrors((prev) => ({
        ...prev,
        ids: "Both ID type and value are required",
      }))
      return
    }

    const newId: identityEntry = {
      idDocName: newIdName,
      idDocValue: newIdValue,
    }

    setNewEmployee((prev) => ({
      ...prev,
      ids: [...prev.ids, newId],
    }))

    setNewIdName("")
    setNewIdValue("")

    // Clear error for ids
    if (formErrors.ids) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.ids
        return newErrors
      })
    }
  }

  const handleRemoveId = (index: number) => {
    setNewEmployee((prev) => ({
      ...prev,
      ids: prev.ids.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setNewEmployee({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      fatherName: "",
      fatherPhone: "",
      motherName: "",
      motherPhone: "",
      dateOfBirth: new Date(),
      workRole: "",
      salary: "0",
      isActive: true,
      isFired: false,
      ids: [],
    })
    setFormErrors({})
    setActiveTab("basic")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert salary to number
      const employeeData: EmployeeAttributes = {
        ...newEmployee,
        salary: Number.parseFloat(newEmployee.salary),
      }

      // Validate the form data
      const validationResult = createEmployeeSchema.safeParse(employeeData)

      if (!validationResult.success) {
        const errors: Record<string, string> = {}
        validationResult.error.errors.forEach((err) => {
          const path = err.path[0] as string
          errors[path] = err.message
        })

        setFormErrors(errors)
        setIsSubmitting(false)

        // Switch to the tab with errors
        if (errors.name || errors.email || errors.password || errors.workRole || errors.phone) {
          setActiveTab("basic")
        } else if (
          errors.address ||
          errors.fatherName ||
          errors.fatherPhone ||
          errors.motherName ||
          errors.motherPhone ||
          errors.dateOfBirth
        ) {
          setActiveTab("personal")
        } else if (errors.ids || errors.salary) {
          setActiveTab("additional")
        }

        return
      }

      toast.promise(addNewEmployee(employeeData), {
        loading: "Adding new employee...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            setAddEmployeeDialogOpen(false)
            resetForm()
            fetchEmployees()
            return "Employee added successfully"
          } else {
            throw new Error(result?.message || "Failed to add employee")
          }
        },
        error: (error) => {
          console.error("Error adding employee:", error)
          return "An error occurred while adding employee"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error adding employee:", error)
      toast.error("An error occurred while adding employee")
      setIsSubmitting(false)
    }
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

            {/* Add Employee Dialog */}
            <Dialog open={addEmployeeDialogOpen} onOpenChange={setAddEmployeeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Employee</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>Fill in the details to create a new employee account.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="personal">Personal Details</TabsTrigger>
                      <TabsTrigger value="additional">Additional Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={newEmployee.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            required
                          />
                          {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={newEmployee.email}
                            onChange={handleInputChange}
                            placeholder="john.doe@example.com"
                            required
                          />
                          {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">
                            Password <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={newEmployee.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            required
                          />
                          {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={newEmployee.phone}
                            onChange={handleInputChange}
                            placeholder="+91 9876543210"
                            required
                          />
                          {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="workRole">
                            Work Role <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="workRole"
                            name="workRole"
                            value={newEmployee.workRole}
                            onChange={handleInputChange}
                            placeholder="Teacher"
                            required
                          />
                          {formErrors.workRole && <p className="text-sm text-red-500">{formErrors.workRole}</p>}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => setActiveTab("personal")}>
                          Next
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="personal" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            value={newEmployee.address}
                            onChange={handleInputChange}
                            placeholder="123 Main St, City"
                          />
                          {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">
                            Date of Birth <span className="text-red-500">*</span>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newEmployee.dateOfBirth && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEmployee.dateOfBirth ? (
                                  format(newEmployee.dateOfBirth, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={newEmployee.dateOfBirth}
                                onSelect={(date) => date && setNewEmployee((prev) => ({ ...prev, dateOfBirth: date }))}
                                initialFocus
                                disabled={(date) => date > new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          {formErrors.dateOfBirth && <p className="text-sm text-red-500">{formErrors.dateOfBirth}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fatherName">Father's Name</Label>
                          <Input
                            id="fatherName"
                            name="fatherName"
                            value={newEmployee.fatherName}
                            onChange={handleInputChange}
                            placeholder="Father's Name"
                          />
                          {formErrors.fatherName && <p className="text-sm text-red-500">{formErrors.fatherName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fatherPhone">Father's Phone</Label>
                          <Input
                            id="fatherPhone"
                            name="fatherPhone"
                            value={newEmployee.fatherPhone}
                            onChange={handleInputChange}
                            placeholder="Father's Phone"
                          />
                          {formErrors.fatherPhone && <p className="text-sm text-red-500">{formErrors.fatherPhone}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="motherName">Mother's Name</Label>
                          <Input
                            id="motherName"
                            name="motherName"
                            value={newEmployee.motherName}
                            onChange={handleInputChange}
                            placeholder="Mother's Name"
                          />
                          {formErrors.motherName && <p className="text-sm text-red-500">{formErrors.motherName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="motherPhone">Mother's Phone</Label>
                          <Input
                            id="motherPhone"
                            name="motherPhone"
                            value={newEmployee.motherPhone}
                            onChange={handleInputChange}
                            placeholder="Mother's Phone"
                          />
                          {formErrors.motherPhone && <p className="text-sm text-red-500">{formErrors.motherPhone}</p>}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                          Previous
                        </Button>
                        <Button type="button" onClick={() => setActiveTab("additional")}>
                          Next
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="additional" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="salary">Salary (₹)</Label>
                          <Input
                            id="salary"
                            name="salary"
                            type="number"
                            value={newEmployee.salary}
                            onChange={handleInputChange}
                            min="0"
                            step="1000"
                          />
                          {formErrors.salary && <p className="text-sm text-red-500">{formErrors.salary}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Identification Documents</Label>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="ID Type (e.g., Aadhar)"
                              value={newIdName}
                              onChange={(e) => setNewIdName(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Input
                                placeholder="ID Value"
                                value={newIdValue}
                                onChange={(e) => setNewIdValue(e.target.value)}
                              />
                              <Button type="button" onClick={handleAddId} size="sm">
                                Add
                              </Button>
                            </div>
                          </div>

                          {formErrors.ids && <p className="text-sm text-red-500">{formErrors.ids}</p>}

                          {newEmployee.ids.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {newEmployee.ids.map((id, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                  <div>
                                    <span className="font-medium">{id.idDocName}:</span> {id.idDocValue}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveId(index)}
                                    className="h-8 w-8 p-0 text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">No identification documents added yet.</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={newEmployee.isActive}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="isActive" className="text-sm font-medium">
                            Active Account
                          </Label>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                          Previous
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Employee"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </form>
              </DialogContent>
            </Dialog>
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
                              disabled={isCurrentUser(employee.id)} // Disable for current user
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                              {isCurrentUser(employee.id) && " (Self)"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToEnable(employee.id)
                              }}
                              className="text-green-600"
                              disabled={isCurrentUser(employee.id)} // Disable for current user
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                              {isCurrentUser(employee.id) && " (Self)"}
                            </DropdownMenuItem>
                          )}

                          {employee.isFired ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToUnfire(employee.id)
                              }}
                              className="text-green-600"
                              disabled={isCurrentUser(employee.id)} // Disable for current user
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reinstate
                              {isCurrentUser(employee.id) && " (Self)"}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEmployeeToFire(employee.id)
                              }}
                              className="text-orange-600"
                              disabled={isCurrentUser(employee.id)} // Disable for current user
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Fire
                              {isCurrentUser(employee.id) && " (Self)"}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmployeeToDelete(employee.id)
                            }}
                            className="text-red-600"
                            disabled={isCurrentUser(employee.id)} // Disable for current user
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                            {isCurrentUser(employee.id) && " (Self)"}
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
              This will remove the fired status from the employee. You will need to enable their account separately.
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
