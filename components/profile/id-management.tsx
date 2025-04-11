"use client"

import { useState, useEffect } from "react"
import type { completeEmployeeAttributes, identityEntry } from "@/types/employee.d"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save } from "lucide-react"
import { updateEmployee } from "@/lib/actions/employee"
import { toast } from "sonner"

interface IdManagementProps {
  employee: completeEmployeeAttributes
}

export function IdManagement({ employee }: IdManagementProps) {
  const [ids, setIds] = useState<identityEntry[]>(employee.ids || [])
  const [newIdName, setNewIdName] = useState("")
  const [newIdValue, setNewIdValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update local state when employee props change (e.g., after refresh)
  useEffect(() => {
    setIds(employee.ids || [])
  }, [employee.ids])

  const handleAddId = () => {
    if (!newIdName || !newIdValue) {
      toast.error("Please enter both ID type and value")
      return
    }

    const newId: identityEntry = {
      idDocName: newIdName,
      idDocValue: newIdValue,
    }

    setIds([...ids, newId])
    setNewIdName("")
    setNewIdValue("")
    setHasChanges(true)
  }

  const handleRemoveId = (index: number) => {
    const newIds = [...ids]
    newIds.splice(index, 1)
    setIds(newIds)
    setHasChanges(true)
  }

  const handleSaveIds = async () => {
    setIsSubmitting(true)
    try {
      // Create a copy of the form values to avoid modifying the original data
      const formData = {
        id: employee.id,
        ids: ids,
      }

      console.log("Saving IDs:", formData)

      const result = await updateEmployee(formData)

      if (result.status === "SUCCESS") {
        toast.success("Identification documents updated successfully")
        setHasChanges(false)
        // Force refresh to show updated data
        window.location.reload()
      } else {
        toast.error(result.message || "Failed to update identification documents")
      }
    } catch (error) {
      toast.error("An error occurred while updating identification documents")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {ids.length > 0 ? (
        <div className="space-y-2">
          {ids.map((id, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <span className="font-medium">{id.idDocName}</span>
                <span className="text-muted-foreground">{id.idDocValue}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveId(index)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No identification documents provided</p>
      )}

      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idName">ID Type</Label>
            <Input
              id="idName"
              value={newIdName}
              onChange={(e) => setNewIdName(e.target.value)}
              placeholder="Aadhar, PAN, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idValue">ID Value</Label>
            <Input
              id="idValue"
              value={newIdValue}
              onChange={(e) => setNewIdValue(e.target.value)}
              placeholder="ID number"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button type="button" size="sm" onClick={handleAddId} className="mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add ID
          </Button>
          {hasChanges && (
            <Button type="button" size="sm" onClick={handleSaveIds} disabled={isSubmitting} className="mt-2">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
