"use client"

import type React from "react"

import { useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createNewStudent } from "@/lib/actions/student"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { identityEntry } from "@/types/employee"
import { EnhancedCalendar } from "@/components/custom/date/calandar-pickup"

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (studentId:string) => void
}

export function AddStudentDialog({ open, onOpenChange, onSuccess }: AddStudentDialogProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // New student form state
  const [newStudent, setNewStudent] = useState({
    name: "",
    address: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    dateOfBirth: new Date(),
    ids: [] as identityEntry[],
    isActive: true,
    UDISECode: ""
  })

  // ID document form state
  const [newIdName, setNewIdName] = useState("")
  const [newIdValue, setNewIdValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewStudent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? String(checked) : value,
      }))
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

    setNewStudent((prev) => ({
      ...prev,
      ids: [...prev.ids, newId],
    }))

    setNewIdName("")
    setNewIdValue("")

    // Clear error for ids
    if (formErrors.ids) {
      setFormErrors((prev) => ({
        ...prev,
        ids: "Both ID type and value are required",
      }))
      return
    }
  }

  const handleRemoveId = (index: number) => {
    setNewStudent((prev) => ({
      ...prev,
      ids: prev.ids.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setNewStudent({
      name: "",
      address: "",
      fatherName: "",
      fatherPhone: "",
      motherName: "",
      motherPhone: "",
      dateOfBirth: new Date(),
      ids: [],
      isActive: true,
      UDISECode: "",
    })
    setFormErrors({})
    setActiveTab("basic")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const requiredFields = ["name", "fatherName", "motherName"]
      const errors: Record<string, string> = {}

      requiredFields.forEach((field) => {
        if (!newStudent[field as keyof typeof newStudent]) {
          errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")} is required`
        }
      })

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        
        setIsSubmitting(false)
        return
      }

      toast.promise(createNewStudent(newStudent), {
        loading: "Adding new student...",
        success: (result) => {
          if (result?.status === "SUCCESS") {
            onOpenChange(false)
            resetForm()
            if (onSuccess) onSuccess(result.data.id)
            return "Student added successfully"
          } else {
            throw new Error(result?.message || "Failed to add student")
          }
        },
        error: (error) => {
          console.error("Error adding student:", error)
          return "An error occurred while adding student"
        },
        finally: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      console.error("Error adding student:", error)
      toast.error("An error occurred while adding student")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>Enter the student details to create a new record.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="parents">Parents</TabsTrigger>
                <TabsTrigger value="ids">ID Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newStudent.name}
                      onChange={handleInputChange}
                      placeholder="Student's full name"
                      required
                    />
                    {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={newStudent.address}
                      onChange={handleInputChange}
                      placeholder="Student's address"
                    />
                    {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <EnhancedCalendar
                      selected={newStudent.dateOfBirth}
                      onSelect={(date) => date && setNewStudent((prev) => ({ ...prev, dateOfBirth: date }))}
                    />
                    {formErrors.dateOfBirth && <p className="text-sm text-red-500">{formErrors.dateOfBirth}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="UDISECode">UDISE Code</Label>
                    <Input
                        id="UDISECode"
                        name="UDISECode"
                        value={newStudent.UDISECode}
                        onChange={handleInputChange}
                        placeholder="UDISE Code"
                    />
                    {formErrors.UDISECode && <p className="text-sm text-red-500">{formErrors.UDISECode}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={newStudent.isActive}
                      onCheckedChange={(checked) => setNewStudent((prev) => ({ ...prev, isActive: !!checked }))}
                    />
                    <Label htmlFor="isActive">Active Student</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setActiveTab("parents")}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Father's Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">
                      Father's Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fatherName"
                      name="fatherName"
                      value={newStudent.fatherName}
                      onChange={handleInputChange}
                      placeholder="Father's name"
                      required
                    />
                    {formErrors.fatherName && <p className="text-sm text-red-500">{formErrors.fatherName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone</Label>
                    <Input
                      id="fatherPhone"
                      name="fatherPhone"
                      value={newStudent.fatherPhone}
                      onChange={handleInputChange}
                      placeholder="Father's phone number"
                    />
                    {formErrors.fatherPhone && <p className="text-sm text-red-500">{formErrors.fatherPhone}</p>}
                  </div>

                  <h3 className="text-lg font-medium mt-6">Mother's Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">
                      Mother's Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="motherName"
                      name="motherName"
                      value={newStudent.motherName}
                      onChange={handleInputChange}
                      placeholder="Mother's name"
                      required
                    />
                    {formErrors.motherName && <p className="text-sm text-red-500">{formErrors.motherName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherPhone">Mother's Phone</Label>
                    <Input
                      id="motherPhone"
                      name="motherPhone"
                      value={newStudent.motherPhone}
                      onChange={handleInputChange}
                      placeholder="Mother's phone number"
                    />
                    {formErrors.motherPhone && <p className="text-sm text-red-500">{formErrors.motherPhone}</p>}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                    Previous
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("ids")}>
                    Next
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ids" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Identification Documents</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {formErrors.ids && <p className="text-sm text-red-500">{formErrors.ids}</p>}

                  {newStudent.ids.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {newStudent.ids.map((id, index) => (
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

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("parents")}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Student"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onOpenChange(false)
              resetForm()
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
