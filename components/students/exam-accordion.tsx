"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import type { examEntry, examEntrySubject } from "@/types/student"
import type { completeSubjectDetails } from "@/types/classroom"
import { cn } from "@/lib/utils"

interface ExamAccordionProps {
  term: string
  exams: examEntry[]
  onUpdateExam: (exam: examEntry) => void
  onDeleteExam: (exam: examEntry) => void
}

export function ExamAccordion({ term, exams, onUpdateExam, onDeleteExam }: ExamAccordionProps) {
  const [openExams, setOpenExams] = useState<Record<string, boolean>>({})

  const toggleExam = (examId: string) => {
    setOpenExams((prev) => ({
      ...prev,
      [examId]: !prev[examId],
    }))
  }

  const calculateObtainedTotal = (subject: examEntrySubject) => {
    let total = 0

    if (subject.theoryExam && subject.obtainedMarksTheory !== null) {
      total += subject.obtainedMarksTheory
    }

    if (subject.practicalExam && subject.obtainedMarksPractical !== null) {
      total += subject.obtainedMarksPractical
    }

    return total
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{term}</h3>
      {exams.map((exam) => (
        <div key={exam.examEntryId} className="border rounded-lg overflow-hidden">
          <div
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => toggleExam(exam.examEntryId)}
          >
            <div>
              <h4 className="text-lg font-medium">{exam.examName}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(exam.examDate), "MMMM d, yyyy")}
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{exam.examType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {exam.studentPassed !== undefined && (
                <Badge
                  variant={exam.studentPassed ? "default" : "destructive"}
                  className={
                    exam.studentPassed
                      ? "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300"
                      : ""
                  }
                >
                  {exam.studentPassed ? "Passed" : "Failed"}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdateExam(exam)
                }}
              >
                Update
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteExam(exam)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {openExams[exam.examEntryId] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>

          {openExams[exam.examEntryId] && exam.subjects && exam.subjects.length > 0 && (
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
              <div className="space-y-2">
                <h5 className="font-medium mb-2">Subjects</h5>
                {exam.subjects.map((subject: completeSubjectDetails, index) => (
                  <div key={index} className="border rounded p-3 bg-white dark:bg-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <h6 className="font-medium">{subject.name}</h6>
                        <span className="text-xs text-muted-foreground">Code: {subject.code}</span>
                      </div>
                      <div className="flex gap-2">
                        {subject.theoryExam && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300"
                          >
                            Theory
                          </Badge>
                        )}
                        {subject.practicalExam && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300"
                          >
                            Practical
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {subject.theoryExam && (
                        <div>
                          <span className="text-muted-foreground">Theory: </span>
                          <span className="font-medium">
                            {subject.obtainedMarksTheory !== null ? subject.obtainedMarksTheory : "-"}/
                            {subject.totalMarksTheory !== null ? subject.totalMarksTheory : "-"}
                          </span>
                        </div>
                      )}

                      {subject.practicalExam && (
                        <div>
                          <span className="text-muted-foreground">Practical: </span>
                          <span className="font-medium">
                            {subject.obtainedMarksPractical !== null ? subject.obtainedMarksPractical : "-"}/
                            {subject.totalMarksPractical !== null ? subject.totalMarksPractical : "-"}
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "sm:col-span-2",
                          (!subject.theoryExam || !subject.practicalExam) && "sm:col-span-1",
                        )}
                      >
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">
                          {calculateObtainedTotal(subject)}/{subject.totalMarks || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
