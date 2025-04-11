"use client"

import { useState } from "react"
import type { completeEmployeeAttributes, identityEntry } from "@/types/employee"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
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
  }

  const handleRemoveId = (index: number) => {
    const newIds = [...ids]
    newIds.splice(index, 1)
    setIds(newIds)
  }

  const handleSaveIds = async () => {
    setIsSubmitting(true)
    try {
      const result = await updateEmployee({
        id: employee.id,
        ids,
      })

      if (result.status === "SUCCESS") {
        toast.success("Identification documents updated successfully")
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
              <div>
                <span className="font-medium">{id.idDocName}: </span>
                <span>{id.idDocValue}</span>
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

      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="idName">ID Type</Label>
            <Input
              id="idName"
              value={newIdName}
              onChange={(e) => setNewIdName(e.target.value)}
              placeholder="Aadhar, PAN, etc."
            />
          </div>
          <div>
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
          {ids.length > 0 && (
            <Button type="button" size="sm" onClick={handleSaveIds} disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
