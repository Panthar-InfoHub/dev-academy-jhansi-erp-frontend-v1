"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { addNewEmployee } from "@/lib/actions/employee"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { identityEntry } from "@/types/employee"
import { createEmployeeSchema } from "@/lib/validation"

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
      const employeeData = {
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
            onOpenChange(false)
            resetForm()
            if (onSuccess) onSuccess()
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

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm()
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>Fill in the details to create a new employee account.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
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
                          {newEmployee.dateOfBirth ? format(newEmployee.dateOfBirth, "PPP") : <span>Pick a date</span>}
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
                    <Checkbox
                      id="isActive"
                      checked={newEmployee.isActive}
                      onCheckedChange={(checked) => setNewEmployee((prev) => ({ ...prev, isActive: !!checked }))}
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
                  <div className="space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Employee"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
