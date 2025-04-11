import { auth, type customUser } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getClassroomDetails, getAllSectionsOfClassroom } from "@/lib/actions/classroom"
import { ClassroomDetail } from "@/components/classroom/classroom-detail"
import { unstable_noStore as noStore } from "next/cache"

interface ClassroomDetailPageProps {
  params: {
    id: string
  }
}

export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  // Disable caching to ensure we always get fresh data
  noStore()

  // Ensure params.id exists before proceeding
  if (!params?.id) {
    notFound()
  }

  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  const classroomId = params.id
  const classroomData = await getClassroomDetails(classroomId)
  const sections = await getAllSectionsOfClassroom(classroomId)

  if (!classroomData) {
    notFound()
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ClassroomDetail classroom={classroomData} sections={sections || []} />
    </div>
  )
}
