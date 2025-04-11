import { auth, type customUser } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as customUser

  // This would be replaced with actual data fetching
  const analyticsData = {
    totalActiveEmployees: 25,
    totalTeachers: 18,
    totalAdmins: 3,
    totalRegisteredStudentsInDB: 450,
    totalActiveStudents: 420,
    enrollmentsCreatedInLastThirtyDays: 15,
    activeStudentEnrollments: 430,
    totalDuePayment: 25000,
    totalVehicles: 8,
    totalFeePaymentsReceived: 350000,
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalActiveStudents}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.totalRegisteredStudentsInDB} registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Out of {analyticsData.totalActiveEmployees} employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.enrollmentsCreatedInLastThirtyDays}</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fee Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData.totalFeePaymentsReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">₹{analyticsData.totalDuePayment.toLocaleString()} due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Total registered vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">With system access</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
