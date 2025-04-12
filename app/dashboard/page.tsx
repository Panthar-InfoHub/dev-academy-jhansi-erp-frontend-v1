"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardAnalytics } from "@/lib/actions/dashboard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface DashboardAnalytics {
  totalActiveEmployees: number
  totalTeachers: number
  totalAdmins: number
  totalRegisteredStudentsInDB: number
  totalActiveStudents: number
  enrollmentsCreatedInLastThirtyDays: number
  activeStudentEnrollments: number
  totalDuePayment: number
  totalVehicles: number
  totalFeePaymentsReceived: number
  monthly_revenue: MonthlyRevenue[]
}

export default function DashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDashboardAnalytics()
      setAnalyticsData(data?.data || null)
    }

    fetchData()
  }, [])

  if (!analyticsData) {
    return <div>Loading...</div>
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Revenue (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
