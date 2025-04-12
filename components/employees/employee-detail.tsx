"use client"

import type React from "react"

import { useState } from "react"
import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"
import { Copy, Ban, CheckCircle, UserX, UserCheck, DollarSign, Trash2, Pencil, ArrowLeft } from "lucide-react"
import { BACKEND_SERVER_URL } from "@/env"
import { updateEmployee, deleteEmployee } from "@/lib/actions/employee"
import { useRouter } from "next/navigation"
import { IdManagement } from "@/components/profile/id-management"
import { UploadProfileImage } from "@/components/profile/upload-profile-image"
import { ProfileAttendance } from "@/components/profile/profile-attendance"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSalarySchema, updatePersonalInfoSchema, updateWorkInfoSchema } from "@/lib/validation"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"

interface EmployeeDetailProps {
  employee: completeEmployeeAttributes
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [newSalary, setNewSalary] = useState(employee.salary.toString())
  const [salaryError, setSalaryError] = useState("")
  const [personalInfoDialogOpen, setPersonalInfoDialogOpen] = useState(false)
  const [workInfoDialogOpen, setWorkInfoDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Personal info form state
  const [personalInfo, setPersonalInfo] = useState({
    name: employee.name,
    address: employee.address || "",
    phone: employee.phone || "",
    fatherName: employee.fatherName || "",
    fatherPhone: employee.fatherPhone || "",
    motherName: employee.motherName || "",
    motherPhone: employee.motherPhone || "",
    dateOfBirth: new Date(employee.dateOfBirth),
  })

  // Work info form state
  const [workInfo, setWorkInfo] = useState({
    email: employee.email,
    workRole: employee.workRole,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${employee.id}/profileImg`

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(employee.id)
    toast.success("Employee ID copied to clipboard")
  }

  // Check if the employee is the current user
  const isCurrentUser = employee.id === currentUserId

  const handleStatusChange = async (status: { isActive?: boolean; isFired?: boolean }) => {
    if (isCurrentUser) {
      toast.error("You cannot modify your own account status")
      return
    }

    setIsSubmitting(true)

    toast.promise(
      updateEmployee({
        id: employee.id,
        ...status,
      }),
      {
        loading: "Updating employee status...",
        success: (result) => {
          if (result.status === "SUCCESS") {
            // Refresh the page to show updated data
            router.refresh()
            return "Employee status updated successfully"
          } else {
            throw new Error(result.message || "Failed to update employee status")
          }
        },
        error: (error) => {
          console.error("Error updating employee status:", error)
          return "An error occurred while updating employee status"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      },
    )
  }

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSalary(e.target.value)
    setSalaryError("")
  }

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate the salary
      const parsedSalary = Number.parseFloat(newSalary)
      const validationResult = updateSalarySchema.safeParse({ salary: parsedSalary })

      if (!validationResult.success) {
        setSalaryError(validationResult.error.errors[0]?.message || "Invalid salary")
        return
      }

      setIsSubmitting(true)

      toast.promise(
        updateEmployee({
          id: employee.id,
          salary: parsedSalary,
        }),
        {
          loading: "Updating salary...",
          success: (result) => {
            if (result.status === "SUCCESS") {
              setSalaryDialogOpen(false)
              router.refresh()
              return "Salary updated successfully"
            } else {
              throw new Error(result.message || "Failed to update salary")
            }
          },
          error: (error) => {
            console.error("Error updating salary:", error)
            return "An error occurred while updating salary"
          },
          finally: () => {
            setIsSubmitting(false)
          },
        },
      )
    } catch (error) {
      setSalaryError("Please enter a valid number")
    }
  }

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setPersonalInfo((prev) => ({
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

  const handleWorkInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWorkInfo((prev) => ({
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

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = updatePersonalInfoSchema.safeParse({
        ...personalInfo,
      })

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

      toast.promise(
        updateEmployee({
          id: employee.id,
          ...personalInfo,
        }),
        {
          loading: "Updating personal information...",
          success: (result) => {
            if (result.status === "SUCCESS") {
              setPersonalInfoDialogOpen(false)
              router.refresh()
              return "Personal information updated successfully"
            } else {
              throw new Error(result.message || "Failed to update personal information")
            }
          },
          error: (error) => {
            console.error("Error updating personal information:", error)
            return "An error occurred while updating personal information"
          },
          finally: () => {
            setIsSubmitting(false)
          },
        },
      )
    } catch (error) {
      console.error("Error updating personal information:", error)
      toast.error("An error occurred while updating personal information")
      setIsSubmitting(false)
    }
  }

  const handleWorkInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate the form data
      const validationResult = updateWorkInfoSchema.safeParse({
        ...workInfo,
      })

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

      toast.promise(
        updateEmployee({
          id: employee.id,
          ...workInfo,
        }),
        {
          loading: "Updating work information...",
          success: (result) => {
            if (result.status === "SUCCESS") {
              setWorkInfoDialogOpen(false)
              router.refresh()
              return "Work information updated successfully"
            } else {
              throw new Error(result.message || "Failed to update work information")
            }
          },
          error: (error) => {
            console.error("Error updating work information:", error)
            return "An error occurred while updating work information"
          },
          finally: () => {
            setIsSubmitting(false)
          },
        },
      )
    } catch (error) {
      console.error("Error updating work information:", error)
      toast.error("An error occurred while updating work information")
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (isCurrentUser) {
      toast.error("You cannot delete your own account")
      return
    }

    setIsDeleting(true)

    toast.promise(deleteEmployee(employee.id), {
      loading: "Deleting employee...",
      success: (result) => {
        if (result?.status === "SUCCESS") {
          router.push("/dashboard/employees")
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
        setIsDeleting(false)
        setDeleteDialogOpen(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>

        {/* Delete Employee Button */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isCurrentUser}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Employee
              {isCurrentUser && " (Self)"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this employee?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the employee and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
            <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={employee.name} />
            <AvatarFallback className="text-2xl md:text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <UploadProfileImage employeeId={employee.id} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{employee.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{employee.workRole}</Badge>
                {employee.isFired ? (
                  <Badge variant="destructive">Fired</Badge>
                ) : employee.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{employee.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">ID: {employee.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyIdToClipboard}>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {/* Personal Info Dialog */}
              <Dialog open={personalInfoDialogOpen} onOpenChange={setPersonalInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Personal Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Edit Personal Information</DialogTitle>
                    <DialogDescription>Update personal details for {employee.name}.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePersonalInfoSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={personalInfo.name}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                          required
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dateOfBirth" className="text-right">
                          Date of Birth
                        </Label>
                        <div className="col-span-3">
                          <EnhancedCalendar
                            selected={personalInfo.dateOfBirth}
                            onSelect={(date) => date && setPersonalInfo((prev) => ({ ...prev, dateOfBirth: date }))}
                          />
                        </div>
                        {formErrors.dateOfBirth && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.dateOfBirth}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={personalInfo.phone}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.phone && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.phone}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                          Address
                        </Label>
                        <Input
                          id="address"
                          name="address"
                          value={personalInfo.address}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.address && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fatherName" className="text-right">
                          Father's Name
                        </Label>
                        <Input
                          id="fatherName"
                          name="fatherName"
                          value={personalInfo.fatherName}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.fatherName && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.fatherName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fatherPhone" className="text-right">
                          Father's Phone
                        </Label>
                        <Input
                          id="fatherPhone"
                          name="fatherPhone"
                          value={personalInfo.fatherPhone}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.fatherPhone && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.fatherPhone}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="motherName" className="text-right">
                          Mother's Name
                        </Label>
                        <Input
                          id="motherName"
                          name="motherName"
                          value={personalInfo.motherName}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.motherName && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.motherName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="motherPhone" className="text-right">
                          Mother's Phone
                        </Label>
                        <Input
                          id="motherPhone"
                          name="motherPhone"
                          value={personalInfo.motherPhone}
                          onChange={handlePersonalInfoChange}
                          className="col-span-3"
                        />
                        {formErrors.motherPhone && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.motherPhone}</p>
                        )}
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

              {/* Work Info Dialog */}
              <Dialog open={workInfoDialogOpen} onOpenChange={setWorkInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Work Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Edit Work Information</DialogTitle>
                    <DialogDescription>Update work details for {employee.name}.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleWorkInfoSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={workInfo.email}
                          onChange={handleWorkInfoChange}
                          className="col-span-3"
                          required
                        />
                        {formErrors.email && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.email}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="workRole" className="text-right">
                          Work Role
                        </Label>
                        <Input
                          id="workRole"
                          name="workRole"
                          value={workInfo.workRole}
                          onChange={handleWorkInfoChange}
                          className="col-span-3"
                          required
                        />
                        {formErrors.workRole && (
                          <p className="text-sm text-red-500 col-start-2 col-span-3">{formErrors.workRole}</p>
                        )}
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

              {/* Salary Update Dialog */}
              <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Update Salary
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Salary</DialogTitle>
                    <DialogDescription>
                      Enter the new salary for {employee.name}. Current salary: ₹{employee.salary.toLocaleString()}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSalarySubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salary" className="text-right">
                          Salary (₹)
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          value={newSalary}
                          onChange={handleSalaryChange}
                          className="col-span-3"
                          min="0"
                          step="1000"
                          required
                        />
                      </div>
                      {salaryError && <p className="text-sm text-red-500 col-start-2 col-span-3">{salaryError}</p>}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Salary"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {employee.isActive ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <Ban className="mr-2 h-4 w-4" />
                      Disable
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to disable this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent the employee from accessing the system. You can re-enable them later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isActive: false })}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Disable
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enable
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to enable this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will allow the employee to access the system again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isActive: true })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Enable
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {employee.isFired ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Reinstate
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to reinstate this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the fired status from the employee. You will need to enable their account
                        separately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isFired: false })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Reinstate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting || isCurrentUser}>
                      <UserX className="mr-2 h-4 w-4" />
                      Fire
                      {isCurrentUser && " (Self)"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to fire this employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the employee as fired in the system and disable their account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange({ isFired: true, isActive: false })}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Fire Employee
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium text-right">
                    {format(new Date(employee.dateOfBirth), "MMMM do, yyyy")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right">{employee.address || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-right">{employee.phone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Family Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Father's Name</span>
                  <span className="font-medium text-right">{employee.fatherName || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Father's Phone</span>
                  <span className="font-medium text-right">{employee.fatherPhone || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Mother's Name</span>
                  <span className="font-medium text-right">{employee.motherName || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Mother's Phone</span>
                  <span className="font-medium text-right">{employee.motherPhone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-right">{employee.workRole}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-medium text-right">₹{employee.salary.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <div className="text-right">
                    {employee.isFired ? (
                      <Badge variant="destructive">Fired</Badge>
                    ) : employee.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="font-medium text-right">{format(new Date(employee.createdAt), "PPP")}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-right">{format(new Date(employee.updatedAt), "PPP")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Identification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <IdManagement employee={employee} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0 space-y-4">
          <ProfileAttendance employeeId={employee.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
