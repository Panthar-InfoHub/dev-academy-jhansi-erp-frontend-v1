"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getDashboardAnalytics } from "@/lib/actions/dashboard"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import DashboardSkeleton from "@/app/dashboard/loading"
import { Users, GraduationCap, CalendarClock, DollarSign, Car, Percent, School } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching dashboard analytics data")
      try {
        const data = await getDashboardAnalytics()
        console.log("Dashboard data received:", JSON.stringify(data))
        setAnalyticsData(data?.data || null)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <h2 className="text-xl font-semibold">No data available</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </motion.div>
      </div>
    )
  }

  // Derived metrics
  const teacherPercentage = Math.round((analyticsData.totalTeachers / analyticsData.totalActiveEmployees) * 100) || 0
  const adminPercentage = Math.round((analyticsData.totalAdmins / analyticsData.totalActiveEmployees) * 100) || 0
  const otherStaffPercentage = 100 - teacherPercentage - adminPercentage

  const activeStudentPercentage =
    Math.round((analyticsData.totalActiveStudents / analyticsData.totalRegisteredStudentsInDB) * 100) || 0

  const recentEnrollmentRate =
    Math.round((analyticsData.enrollmentsCreatedInLastThirtyDays / analyticsData.totalActiveStudents) * 100) || 0

  const paymentCollectionRate =
    Math.round(
      (analyticsData.totalFeePaymentsReceived /
        (analyticsData.totalFeePaymentsReceived + analyticsData.totalDuePayment)) *
        100,
    ) || 0

  const studentTeacherRatio =
    analyticsData.totalTeachers > 0
      ? Math.round((analyticsData.totalActiveStudents / analyticsData.totalTeachers) * 10) / 10
      : 0

  // Prepare data for staff distribution chart
  const staffDistribution = [
    { name: "Teachers", value: analyticsData.totalTeachers },
    { name: "Admins", value: analyticsData.totalAdmins },
    {
      name: "Other Staff",
      value: analyticsData.totalActiveEmployees - analyticsData.totalTeachers - analyticsData.totalAdmins,
    },
  ].filter((item) => item.value > 0)

  // Prepare data for student status chart
  const studentStatus = [
    { name: "Active", value: analyticsData.totalActiveStudents },
    { name: "Inactive", value: analyticsData.totalRegisteredStudentsInDB - analyticsData.totalActiveStudents },
  ]

  // Prepare enhanced revenue data
  const enhancedRevenueData = analyticsData.monthly_revenue.map((item, index, array) => {
    // Calculate growth percentage if there's a previous month
    const prevMonth = index > 0 ? array[index - 1].revenue : null
    const growthPercent = prevMonth ? Math.round(((item.revenue - prevMonth) / prevMonth) * 100) : null

    return {
      ...item,
      growthPercent,
      // Add a trend indicator
      trend: growthPercent === null ? "neutral" : growthPercent >= 0 ? "up" : "down",
    }
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const numberVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const progressVariants = {
    hidden: { width: "0%" },
    visible: (value: number) => ({
      width: `${value}%`,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    }),
  }

  return (
    <motion.div className="w-full px-1 md:px-4" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        variants={itemVariants}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">School Dashboard</h1>
        <div className="flex items-center mt-2 md:mt-0">
          <motion.div
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CalendarClock className="w-4 h-4 mr-1" />
            Last updated: {new Date().toLocaleDateString()}
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {analyticsData.totalActiveStudents}
              </motion.div>
              <div className="flex flex-col mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Active</span>
                  <span>{activeStudentPercentage}%</span>
                </div>
                <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeStudentPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analyticsData.totalRegisteredStudentsInDB} total registered
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {analyticsData.totalActiveEmployees}
              </motion.div>
              <div className="grid grid-cols-3 gap-1 mt-2">
                <div className="flex flex-col">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-500 font-medium">Teachers</span>
                  </div>
                  <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${teacherPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs mt-1">{analyticsData.totalTeachers}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-500 font-medium">Admins</span>
                  </div>
                  <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                    <motion.div
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${adminPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs mt-1">{analyticsData.totalAdmins}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-500 font-medium">Other</span>
                  </div>
                  <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                    <motion.div
                      className="h-full bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${otherStaffPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs mt-1">
                    {analyticsData.totalActiveEmployees - analyticsData.totalTeachers - analyticsData.totalAdmins}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Finances</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                ₹{analyticsData.totalFeePaymentsReceived.toLocaleString()}
              </motion.div>
              <div className="flex flex-col mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Collection Rate</span>
                  <span>{paymentCollectionRate}%</span>
                </div>
                <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentCollectionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ₹{analyticsData.totalDuePayment.toLocaleString()} payment due
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {analyticsData.enrollmentsCreatedInLastThirtyDays}
              </motion.div>
              <div className="flex flex-col mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>30-Day Growth</span>
                  <span>{recentEnrollmentRate}%</span>
                </div>
                <div className="h-2 relative rounded-full overflow-hidden bg-secondary">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(recentEnrollmentRate * 2, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analyticsData.activeStudentEnrollments} active enrollments
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div className="grid gap-4 sm:grid-cols-3 mt-4" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Student-Teacher Ratio</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-center h-24">
                <motion.div
                  className="text-4xl font-bold flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.6 }}
                >
                  {studentTeacherRatio}:1
                </motion.div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {studentTeacherRatio < 15 ? "Excellent" : studentTeacherRatio < 25 ? "Good" : "Needs improvement"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-center h-24">
                <motion.div
                  className="text-4xl font-bold flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.7 }}
                >
                  <Car className="h-8 w-8 mr-2 text-primary" />
                  {analyticsData.totalVehicles}
                </motion.div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {analyticsData.totalVehicles > 0
                  ? `Approx. ${Math.round(analyticsData.totalActiveStudents / analyticsData.totalVehicles)} students per vehicle`
                  : "No vehicles registered"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-center h-24">
                <motion.div
                  className="text-4xl font-bold flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.8 }}
                >
                  <Percent className="h-8 w-8 mr-2 text-green-500" />
                  {paymentCollectionRate}
                </motion.div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {paymentCollectionRate > 90
                  ? "Excellent collection rate"
                  : paymentCollectionRate > 75
                    ? "Good collection rate"
                    : "Collection rate needs improvement"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-4  mt-4">
        <motion.div variants={chartVariants} initial="hidden" animate="visible" transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
              <CardDescription>Monthly revenue with growth indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={enhancedRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        
      </div>
    </motion.div>
  )
}
