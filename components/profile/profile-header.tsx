import type { completeEmployeeAttributes } from "@/types/employee"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { UploadProfileImage } from "@/components/profile/upload-profile-image"
import { BACKEND_SERVER_URL } from "@/env"

interface ProfileHeaderProps {
  employee: completeEmployeeAttributes
}

export function ProfileHeader({ employee }: ProfileHeaderProps) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${employee.id}/image`

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-background">
          <AvatarImage src={profileImageUrl} alt={employee.name} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <UploadProfileImage employeeId={employee.id} />
      </div>

      <div className="space-y-2 flex-1">
        <h1 className="text-3xl font-bold">{employee.name}</h1>
        <p className="text-muted-foreground">
          {employee.workRole} • {employee.email}
        </p>

        <div className="flex gap-2 mt-4">
          <EditProfileDialog employee={employee} />
        </div>
      </div>
    </div>
  )
}
