"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Copy, ExternalLink, MoreHorizontal, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { getAllVehicles, deleteVehicle } from "@/lib/actions/vehicle"
import type { completeVehicleDetails } from "@/types/vehicle"
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
import { AddVehicleDialog } from "./add-vehicle-dialog"
import { EditVehicleDialog } from "./edit-vehicle-dialog"

interface VehiclesTableProps {
  initialVehicles: completeVehicleDetails[]
}

export function VehiclesTable({ initialVehicles }: VehiclesTableProps) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<completeVehicleDetails[]>(initialVehicles)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredVehicles, setFilteredVehicles] = useState<completeVehicleDetails[]>(initialVehicles)
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false)
  const [editVehicleDialogOpen, setEditVehicleDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<completeVehicleDetails | null>(null)

  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await getAllVehicles()
      if (response?.status === "SUCCESS") {
        setVehicles(response.data || [])
        filterVehicles(response.data || [], searchQuery)
        toast.success("Vehicles loaded successfully")
      } else {
        toast.error("Failed to fetch vehicles")
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      toast.error("An error occurred while fetching vehicles")
    } finally {
      setIsLoading(false)
    }
  }

  const filterVehicles = (vehiclesList: completeVehicleDetails[], query: string) => {
    if (!query.trim()) {
      setFilteredVehicles(vehiclesList)
      return
    }

    const filtered = vehiclesList.filter((vehicle) => vehicle.vehicleNumber.toLowerCase().includes(query.toLowerCase()))
    setFilteredVehicles(filtered)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    filterVehicles(vehicles, searchQuery)
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    filterVehicles(vehicles, query)
  }

  const handleViewVehicle = (vehicleId: string) => {
    router.push(`/dashboard/vehicle/${vehicleId}`)
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Vehicle ID copied to clipboard")
  }

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteVehicle(vehicleToDelete)

      if (result?.status === "SUCCESS") {
        // Update local state
        setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleToDelete))
        filterVehicles(
          vehicles.filter((vehicle) => vehicle.id !== vehicleToDelete),
          searchQuery,
        )
        setVehicleToDelete(null)
        toast.success("Vehicle deleted successfully")
      } else {
        toast.error(result?.message || "Failed to delete vehicle")
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      toast.error("An error occurred while deleting vehicle")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditVehicle = (vehicle: completeVehicleDetails) => {
    setSelectedVehicle(vehicle)
    setEditVehicleDialogOpen(true)
  }

  const handleVehicleAdded = (vehicle: completeVehicleDetails) => {
    setVehicles((prev) => [...prev, vehicle])
    filterVehicles([...vehicles, vehicle], searchQuery)
    toast.success("Vehicle added successfully")
  }

  const handleVehicleUpdated = (updatedVehicle: completeVehicleDetails) => {
    setVehicles((prev) => prev.map((vehicle) => (vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle)))
    filterVehicles(
      vehicles.map((vehicle) => (vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle)),
      searchQuery,
    )
    toast.success("Vehicle updated successfully")
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <form onSubmit={handleSearch} className="flex w-full sm:w-1/2 gap-2">
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchVehicles} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => setAddVehicleDialogOpen(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Vehicle</span>
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{vehicle.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyId(vehicle.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(vehicle.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewVehicle(vehicle.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setVehicleToDelete(vehicle.id)} className="text-red-600">
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
      </CardContent>

      {/* Delete Vehicle Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
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

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={addVehicleDialogOpen}
        onOpenChange={setAddVehicleDialogOpen}
        onSuccess={handleVehicleAdded}
      />

      {/* Edit Vehicle Dialog */}
      {selectedVehicle && (
        <EditVehicleDialog
          open={editVehicleDialogOpen}
          onOpenChange={setEditVehicleDialogOpen}
          vehicle={selectedVehicle}
          onSuccess={handleVehicleUpdated}
        />
      )}
    </Card>
  )
}
