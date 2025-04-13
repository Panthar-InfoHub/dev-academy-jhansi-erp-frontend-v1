import { auth, type customUser } from "@/auth"
import { fetchEmployeeDetails } from "@/lib/actions/employee"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { EmployeeDetail } from "@/components/employees/employee-detail"
import { unstable_noStore as noStore } from "next/cache"

export default async function ProfilePage() {
  // Disable caching to ensure we always get fresh data
  noStore()

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.id) {
    notFound()
  }

  const employeeData = await fetchEmployeeDetails(user.id)

  if (!employeeData) {
    notFound()
  }

  // If the user is an admin, use the EmployeeDetail component
  // Otherwise, use the ProfileHeader and ProfileTabs components
  if (user.isAdmin) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <EmployeeDetail employee={employeeData} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ProfileHeader employee={employeeData} />
      <ProfileTabs employee={employeeData} />
    </div>
  )
}
