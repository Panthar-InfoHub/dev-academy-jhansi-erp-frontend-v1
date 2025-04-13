import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import CheckInHandler from "@/components/employees/CheckInHandler";

export default async function EmployeeDetailPage() {
  // Disable caching to ensure we always get fresh data
  noStore()
  
  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <CheckInHandler employeeId={user.id} />
    </div>
  )
}
