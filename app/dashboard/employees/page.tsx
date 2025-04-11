import { auth, type customUser } from "@/auth"
import { searchEmployees } from "@/lib/actions/employee"
import { redirect } from "next/navigation"
import { EmployeesTable } from "@/components/employees/employees-table"

export default async function EmployeesPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const employeesResponse = await searchEmployees("", 1, 10, false)
  const employees = employeesResponse?.data || []
  const totalCount = employeesResponse?.count || 0

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
      </div>

      <EmployeesTable initialEmployees={employees} initialTotalCount={totalCount} />
    </div>
  )
}
