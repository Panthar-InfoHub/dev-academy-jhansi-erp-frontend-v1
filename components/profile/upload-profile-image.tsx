"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { updateEmployeeProfileImage } from "@/lib/actions/employee"
import { toast } from "sonner"
import { Camera } from "lucide-react"

interface UploadProfileImageProps {
  employeeId: string
}

export function UploadProfileImage({ employeeId }: UploadProfileImageProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const result = await updateEmployeeProfileImage(employeeId, file)

      if (result?.status === "SUCCESS") {
        toast.success("Profile image updated successfully")
        // Force refresh the page to show the new image
        window.location.reload()
      } else {
        toast.error(result?.message || "Failed to update profile image")
      }
    } catch (error) {
      toast.error("An error occurred while updating profile image")
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-0 right-0 rounded-full bg-background h-8 w-8"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="h-4 w-4" />
      </Button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </>
  )
}
