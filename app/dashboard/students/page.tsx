import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { StudentsTable } from "@/components/students/students-table"
import { getAllClassrooms } from "@/lib/actions/classroom"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

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
        <Link href="/dashboard/students/add">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      <StudentsTable initialClassrooms={classrooms || []} />
    </div>
  )
}
