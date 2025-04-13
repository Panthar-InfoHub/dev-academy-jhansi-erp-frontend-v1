import { auth, type customUser } from "@/auth"
import { fetchEmployeeDetails } from "@/lib/actions/employee"
import { notFound, redirect } from "next/navigation"
import { EmployeeDetail } from "@/components/employees/employee-detail"
import { unstable_noStore as noStore } from "next/cache"

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  // Disable caching to ensure we always get fresh data
  noStore()

  // Ensure params.id exists before proceeding
  if (!(await params)?.id) {
    notFound()
  }

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }
  
  const employeeId = (await params).id
  
  if (user.id !== employeeId && !user.isAdmin) { redirect("/dashboard/profile")}


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
