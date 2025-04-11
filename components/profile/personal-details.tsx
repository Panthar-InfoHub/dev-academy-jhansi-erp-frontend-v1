import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { IdManagement } from "@/components/profile/id-management"

interface PersonalDetailsProps {
  employee: completeEmployeeAttributes
}

export function PersonalDetails({ employee }: PersonalDetailsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Date of Birth</span>
            <span className="font-medium text-right">{format(new Date(employee.dateOfBirth), "MMMM do, yyyy")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium text-right">{employee.address || "Not provided"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium text-right">{employee.phone || "Not provided"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Father's Name</span>
            <span className="font-medium text-right">{employee.fatherName || "Not provided"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Father's Phone</span>
            <span className="font-medium text-right">{employee.fatherPhone || "Not provided"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Mother's Name</span>
            <span className="font-medium text-right">{employee.motherName || "Not provided"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Mother's Phone</span>
            <span className="font-medium text-right">{employee.motherPhone || "Not provided"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-right">{employee.workRole}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Salary</span>
            <span className="font-medium text-right">₹{employee.salary.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Status</span>
            <div className="text-right">
              <Badge variant={employee.isActive ? "default" : "destructive"}>
                {employee.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Identification Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <IdManagement employee={employee} />
        </CardContent>
      </Card>
    </div>
  )
}
