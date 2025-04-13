"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ResultCard } from "./result-card"
import type { examEntry, examEntrySubject } from "@/types/student"
import { FileText } from "lucide-react"

interface ResultDialogProps {
  examDetails: examEntry[]
  subjects: examEntrySubject[]
  studentName: string
  className: string
  sectionName: string
  // Additional props
  fathersName?: string
  dob?: string
  buttonText?: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ResultDialog({
  examDetails,
  subjects,
  studentName,
  className,
  sectionName,
  fathersName,
  dob,
  buttonText = "View Result Card",
  buttonVariant = "default",
}: ResultDialogProps) {
  console.log("Rendering ResultDialog component")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto bg-white dark:bg-white">
        <ResultCard
          examDetails={examDetails}
          subjects={subjects}
          studentName={studentName}
          className={className}
          sectionName={sectionName}
          fathersName={fathersName}
          dob={dob}
        />
      </DialogContent>
    </Dialog>
  )
}
