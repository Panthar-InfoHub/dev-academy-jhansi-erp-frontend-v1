import { auth, type customUser } from "@/auth"
import { getStudent } from "@/lib/actions/student"
import { redirect, notFound } from "next/navigation"
import { StudentDetail } from "@/components/students/student-detail"
import { unstable_noStore as noStore } from "next/cache"

interface StudentDetailPageProps {
  params: {
    student_id: string
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  // Disable caching to ensure we always get fresh data
  noStore()

  // Ensure params.student_id exists before proceeding
  if (!params?.student_id) {
    notFound()
  }

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const studentId = params.student_id
  const studentResponse = await getStudent(studentId)

  if (!studentResponse?.data) {
    notFound()
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <StudentDetail student={studentResponse.data} />
    </div>
  )
}
