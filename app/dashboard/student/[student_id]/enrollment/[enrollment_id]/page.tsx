import { auth, type customUser } from "@/auth"
import { getEnrollmentDetails } from "@/lib/actions/student"
import { redirect, notFound } from "next/navigation"
import { EnrollmentDetail }  from "@/components/students/enrollment-detail"
import { unstable_noStore as noStore } from "next/cache"

interface EnrollmentDetailPageProps {
  params: Promise<{
    student_id: string
    enrollment_id: string
  }>
}

export default async function EnrollmentDetailPage({ params }: EnrollmentDetailPageProps) {
  // Disable caching to ensure we always get fresh data
  noStore()

  // Ensure params exist before proceeding
  const resolvedParams = await params
  if (!resolvedParams?.student_id || !resolvedParams?.enrollment_id) {
    notFound()
  }

  const session = await auth()
  const user = session?.user as customUser

  if (!user || (!user.isAdmin && !user.isTeacher)) {
    redirect("/dashboard")
  }

  const studentId = resolvedParams.student_id
  const enrollmentId = resolvedParams.enrollment_id

  const enrollmentResponse = await getEnrollmentDetails(studentId, enrollmentId)

  if (!enrollmentResponse?.data) {
    notFound()
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <EnrollmentDetail enrollment={enrollmentResponse.data} studentId={studentId} user={user} />
    </div>
  )
}
