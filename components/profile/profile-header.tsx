"use client"

import type { completeEmployeeAttributes } from "@/types/employee.d"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProfileButton } from "@/components/profile/edit-profile-button"
import { UploadProfileImage } from "@/components/profile/upload-profile-image"
import { BACKEND_SERVER_URL } from "@/env"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

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

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(employee.id)
    toast.success("Employee ID copied to clipboard")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8">
      <div className="relative">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background">
          <AvatarImage src={profileImageUrl} alt={employee.name} />
          <AvatarFallback className="text-2xl sm:text-3xl">{initials}</AvatarFallback>
        </Avatar>
        <UploadProfileImage employeeId={employee.id} />
      </div>

      <div className="space-y-2 flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{employee.name}</h1>
          <Badge variant="outline" className="w-fit mx-auto sm:mx-0">
            {employee.workRole}
          </Badge>
        </div>
        <p className="text-muted-foreground">{employee.email}</p>

        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
          <span className="text-sm text-muted-foreground">ID: {employee.id}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyIdToClipboard}>
            <Copy className="h-3.5 w-3.5" />
            <span className="sr-only">Copy ID</span>
          </Button>
        </div>

        <div className="pt-2">
          <EditProfileButton employee={employee} />
        </div>
      </div>
    </div>
  )
}
