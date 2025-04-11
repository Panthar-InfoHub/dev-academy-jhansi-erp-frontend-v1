"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { completeVehicleDetails } from "@/types/vehicle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Copy } from "lucide-react"
import { deleteVehicle } from "@/lib/actions/vehicle"
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
import { format } from "date-fns"
import { EditVehicleDialog } from "./edit-vehicle-dialog"
import { VehicleMapPlaceholder } from "./vehicle-map-placeholder"

interface VehicleDetailProps {
  vehicle: completeVehicleDetails
}

export function VehicleDetail({ vehicle: initialVehicle }: VehicleDetailProps) {
  const router = useRouter()
  const [vehicle, setVehicle] = useState<completeVehicleDetails>(initialVehicle)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleDeleteVehicle = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteVehicle(vehicle.id)

      if (result?.status === "SUCCESS") {
        toast.success("Vehicle deleted successfully")
        router.push("/dashboard/vehicles")
      } else {
        toast.error(result?.message || "Failed to delete vehicle")
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      toast.error("An error occurred while deleting vehicle")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Vehicle ID copied to clipboard")
  }

  const handleVehicleUpdated = (updatedVehicle: completeVehicleDetails) => {
    setVehicle(updatedVehicle)
    toast.success("Vehicle updated successfully")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Sidebar - Left Column */}
      <div className="md:col-span-3">
        <div className="space-y-6">
          <Button variant="outline" onClick={() => router.push("/dashboard/vehicles")} className="w-full justify-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Vehicle Number</h3>
                <p className="text-lg font-semibold">{vehicle.vehicleNumber}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">{vehicle.id}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(vehicle.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                <p>{format(new Date(vehicle.createdAt), "PPP p")}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p>{format(new Date(vehicle.updatedAt), "PPP p")}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Last Known Location</h3>
                {vehicle.latest_lat && vehicle.latest_long ? (
                  <p>
                    Lat: {vehicle.latest_lat.toFixed(6)}, Long: {vehicle.latest_long.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No location data available</p>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={() => setEditDialogOpen(true)} className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Vehicle
                </Button>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Vehicle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this vehicle?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the vehicle and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteVehicle}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Right Column */}
      <div className="md:col-span-9">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Vehicle Location</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleMapPlaceholder
              lat={vehicle.latest_lat}
              long={vehicle.latest_long}
              vehicleNumber={vehicle.vehicleNumber}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Vehicle Dialog */}
      <EditVehicleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        vehicle={vehicle}
        onSuccess={handleVehicleUpdated}
      />
    </div>
  )
}
