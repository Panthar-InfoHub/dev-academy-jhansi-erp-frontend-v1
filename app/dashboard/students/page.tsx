import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { StudentsTable } from "@/components/students/students-table"
import { getAllClassrooms } from "@/lib/actions/classroom"


export default async function StudentsPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  // Fetch all classrooms for the dropdown
  const classrooms = await getAllClassrooms()

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
      </div>

      <StudentsTable initialClassrooms={classrooms || []} />
    </div>
  )
}
