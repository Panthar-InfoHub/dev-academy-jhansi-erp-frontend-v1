import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { getAllClassrooms } from "@/lib/actions/classroom"
import { ClassroomTable } from "@/components/classroom/classroom-table"

export default async function ClassroomPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || (!user.isAdmin && !user.isTeacher)) {
    redirect("/dashboard")
  }

  const classrooms = await getAllClassrooms()

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Classes</h1>
      </div>

      <ClassroomTable initialClassrooms={classrooms || []} user={user} />
    </div>
  )
}
