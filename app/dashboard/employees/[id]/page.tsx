import { auth, type customUser } from "@/auth"
import { fetchEmployeeDetails } from "@/lib/actions/employee"
import { notFound, redirect } from "next/navigation"
import { EmployeeDetail } from "@/components/employees/employee-detail"
import { unstable_noStore as noStore } from "next/cache"

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  // Disable caching to ensure we always get fresh data
  noStore()

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const employeeId = params.id
  const employeeData = await fetchEmployeeDetails(employeeId)

  if (!employeeData) {
    notFound()
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <EmployeeDetail employee={employeeData} />
    </div>
  )
}
