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
import { toast } from "sonner"
import { createVehicle } from "@/lib/actions/vehicle"
import type { completeVehicleDetails } from "@/types/vehicle"

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (vehicle: completeVehicleDetails) => void
}

export function AddVehicleDialog({ open, onOpenChange, onSuccess }: AddVehicleDialogProps) {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate input
    if (!vehicleNumber.trim()) {
      setError("Vehicle number is required")
      return
    }

    // Validate against regex pattern
    const vehicleNumberRegex = /^[A-Z]{2} \d{2} [A-Z]{2} \d{4}$/
    if (!vehicleNumberRegex.test(vehicleNumber.trim())) {
      setError("Vehicle number must be in format: XX 00 XX 0000 (e.g., KA 01 AB 1234)")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      console.log("Creating vehicle with number:", vehicleNumber)
      const result = await createVehicle({ vehicleNumber: vehicleNumber.trim() })

      if (result?.status === "SUCCESS" && result.data) {
        toast.success("Vehicle added successfully")
        setVehicleNumber("")
        onOpenChange(false)

        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        setError(result?.message || "Failed to add vehicle")
        toast.error(result?.message || "Failed to add vehicle")
      }
    } catch (error) {
      console.error("Error adding vehicle:", error)
      setError("An error occurred while adding the vehicle")
      toast.error("An error occurred while adding the vehicle")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setVehicleNumber("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>Enter the vehicle details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value)
                  setError("")
                }}
                placeholder="e.g., KA 01 AB 1234"
                className="w-full"
                autoComplete="off"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-sm text-muted-foreground">Format: XX 00 XX 0000 (e.g., KA 01 AB 1234)</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
