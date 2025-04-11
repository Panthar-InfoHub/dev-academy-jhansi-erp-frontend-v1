import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { getAllVehicles } from "@/lib/actions/vehicle"
import { VehiclesTable } from "@/components/vehicles/vehicles-table"

export default async function VehiclesPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const vehiclesResponse = await getAllVehicles()
  const vehicles = vehiclesResponse?.data || []

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicles</h1>
      </div>

      <VehiclesTable initialVehicles={vehicles} />
    </div>
  )
}
