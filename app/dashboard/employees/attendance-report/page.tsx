import { auth, type customUser } from "@/auth"
import { redirect } from "next/navigation"
import { AttendanceReport } from "@/components/employees/attendance-report"
import SetDayAsHolidayWrapper from "@/app/dashboard/employees/attendance-report/HolidayWrapper";

export default async function AttendanceReportPage() {
  const session = await auth()
  const user = session?.user as customUser

  if (!user || !user.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance Report</h1>
        <SetDayAsHolidayWrapper />
      </div>

      <AttendanceReport />
    </div>
  )
}


