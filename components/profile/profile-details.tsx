import type { completeEmployeeAttributes } from "@/types/employee"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface ProfileDetailsProps {
  employee: completeEmployeeAttributes
}

export function ProfileDetails({ employee }: ProfileDetailsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date of Birth</span>
            <span className="font-medium">{format(new Date(employee.dateOfBirth), "PPP")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium">{employee.address || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{employee.phone || "Not provided"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Father's Name</span>
            <span className="font-medium">{employee.fatherName || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Father's Phone</span>
            <span className="font-medium">{employee.fatherPhone || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mother's Name</span>
            <span className="font-medium">{employee.motherName || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mother's Phone</span>
            <span className="font-medium">{employee.motherPhone || "Not provided"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{employee.workRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salary</span>
            <span className="font-medium">₹{employee.salary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={employee.isActive ? "default" : "destructive"}>
              {employee.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identification Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {employee.ids && employee.ids.length > 0 ? (
            <ul className="space-y-2">
              {employee.ids.map((id, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{id.idDocName}</span>
                  <span className="font-medium">{id.idDocValue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No identification documents provided</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{employee.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created At</span>
            <span className="font-medium">{format(new Date(employee.createdAt), "PPP")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">{format(new Date(employee.updatedAt), "PPP")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
