import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { StudentsSearchTable } from "@/components/students/students-search-table"

export default async function StudentsSearchPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || (!user.isAdmin && !user.isTeacher)) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Advanced Search</h1>
      </div>

      <StudentsSearchTable />
    </div>
  )
}
