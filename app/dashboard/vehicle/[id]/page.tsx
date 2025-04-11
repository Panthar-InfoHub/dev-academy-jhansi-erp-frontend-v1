import { auth, type customUser } from "@/auth"
import { getVehicle } from "@/lib/actions/vehicle"
import { notFound, redirect } from "next/navigation"
import { VehicleDetail } from "@/components/vehicles/vehicle-detail"
import { unstable_noStore as noStore } from "next/cache"

interface VehicleDetailPageProps {
  params: {
    id: string
  }
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  // Disable caching to ensure we always get fresh data
  noStore()

  // Ensure params.id exists before proceeding
  if (!params?.id) {
    notFound()
  }

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const vehicleId = params.id
  const vehicleResponse = await getVehicle(vehicleId)

  if (!vehicleResponse?.data) {
    notFound()
  }

  return (
    <div className="container mx-auto">
      <VehicleDetail vehicle={vehicleResponse.data} />
    </div>
  )
}
