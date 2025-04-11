"use client"

import { useState } from "react"
import type { completeEmployeeAttributes } from "@/types/employee"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalDetails } from "@/components/profile/personal-details"
import { ProfileAttendance } from "@/components/profile/profile-attendance"

interface ProfileTabsProps {
  employee: completeEmployeeAttributes
}

export function ProfileTabs({ employee }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="details">Personal Details</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-0">
        <PersonalDetails employee={employee} />
      </TabsContent>

      <TabsContent value="attendance" className="mt-0">
        <ProfileAttendance employeeId={employee.id} />
      </TabsContent>
    </Tabs>
  )
}
