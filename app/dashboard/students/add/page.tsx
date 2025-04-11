"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AddStudentDialog } from "@/components/students/add-student-dialog"

export default function AddStudentPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(true)

  const handleSuccess = () => {
    router.push("/dashboard/students")
  }

  const handleCancel = () => {
    router.push("/dashboard/students")
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <h1 className="text-3xl font-bold">Add New Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Please fill out the student information in the dialog.</p>
        </CardContent>
      </Card>

      <AddStudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) handleCancel()
        }}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
