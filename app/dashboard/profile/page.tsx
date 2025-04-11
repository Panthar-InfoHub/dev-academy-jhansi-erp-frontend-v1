import { auth, type customUser } from "@/auth"
import { fetchEmployeeDetails } from "@/lib/actions/employee"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileDetails } from "@/components/profile/profile-details"
import { ProfileAttendance } from "@/components/profile/profile-attendance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    <div className="container mx-auto py-6">
      <ProfileHeader employee={employeeData} />

      <Tabs defaultValue="details" className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Personal Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <ProfileDetails employee={employeeData} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <ProfileAttendance employeeId={employeeData.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
