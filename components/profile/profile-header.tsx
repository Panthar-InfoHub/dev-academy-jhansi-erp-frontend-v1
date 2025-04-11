import type { completeEmployeeAttributes } from "@/types/employee"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfileButton } from "@/components/profile/edit-profile-button"
import { UploadProfileImage } from "@/components/profile/upload-profile-image"
import { BACKEND_SERVER_URL } from "@/env"
import { Badge } from "@/components/ui/badge"

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

  const profileImageUrl = `${BACKEND_SERVER_URL}/v1/employee/${employee.id}/profileImg`

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-background">
          <AvatarImage src={profileImageUrl} alt={employee.name} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <UploadProfileImage employeeId={employee.id} />
      </div>

      <div className="space-y-2 flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h1 className="text-3xl font-bold">{employee.name}</h1>
          <Badge variant="outline" className="w-fit mx-auto md:mx-0">
            {employee.workRole}
          </Badge>
        </div>
        <p className="text-muted-foreground">{employee.email}</p>

        <div className="pt-2">
          <EditProfileButton employee={employee} />
        </div>
      </div>
    </div>
  )
}
