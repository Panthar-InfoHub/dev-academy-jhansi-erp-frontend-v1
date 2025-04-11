import { auth, type customUser } from "@/auth"
import { fetchEmployeeDetails } from "@/lib/actions/employee"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"

export default async function ProfilePage() {
  const session = await auth()
  const user = session?.user as customUser

  
  if (!user || !user.id) {
    notFound()
  }

  const employeeData = await fetchEmployeeDetails(user.id)

  if (!employeeData) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <ProfileHeader employee={employeeData} />
      <ProfileTabs employee={employeeData} />
    </div>
  )
}
