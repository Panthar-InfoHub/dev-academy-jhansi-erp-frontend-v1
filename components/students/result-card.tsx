"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { toPng } from "html-to-image"
import type { examEntry, examEntrySubject } from "@/types/student"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResultCardProps {
  examDetails: examEntry[]
  subjects: examEntrySubject[]
  studentName: string
  className: string
  sectionName: string
  // Additional props that will be passed by the user
  fathersName?: string
  dob?: string
}

export function ResultCard({
  examDetails,
  subjects,
  studentName,
  className,
  sectionName,
  fathersName,
  dob,
}: ResultCardProps) {
  console.log("Rendering ResultCard component with data:", { examDetails, subjects })

  const [termData, setTermData] = useState<
    {
      term: string
      subjects: examEntrySubject[]
    }[]
  >([])

  const [totalMarks, setTotalMarks] = useState<{ [term: string]: number }>({})
  const [grandTotal, setGrandTotal] = useState<number>(0)
  const [maxMarks, setMaxMarks] = useState<number>(0)
  const resultCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("Processing exam details:", examDetails)

    // Group exams by term
    const groupedByTerm = examDetails.reduce(
      (acc, exam) => {
        if (!acc[exam.term]) {
          acc[exam.term] = {
            term: exam.term,
            subjects: [],
          }
        }

        // Add subjects to this term
        acc[exam.term].subjects = [...acc[exam.term].subjects, ...exam.subjects]
        return acc
      },
      {} as { [term: string]: { term: string; subjects: examEntrySubject[] } },
    )

    console.log("Grouped by term:", JSON.stringify(groupedByTerm, null, 2))

    // Convert to array and sort by term
    const termsArray = Object.values(groupedByTerm)
    setTermData(termsArray)

    // Calculate total marks for each term
    const termTotals: { [term: string]: number } = {}
    let calculatedMaxMarks = 0

    termsArray.forEach((term) => {
      const total = term.subjects.reduce((sum, subject) => {
        const theoryMarks = subject.obtainedMarksTheory || 0
        const practicalMarks = subject.obtainedMarksPractical || 0
        return sum + theoryMarks + practicalMarks
      }, 0)

      // Calculate max marks from the first term's total possible marks
      if (calculatedMaxMarks === 0) {
        calculatedMaxMarks = term.subjects.reduce((sum, subject) => {
          const theoryMax = subject.totalMarksTheory || 0
          const practicalMax = subject.totalMarksPractical || 0
          return sum + theoryMax + practicalMax
        }, 0)
      }

      termTotals[term.term] = total
    })

    console.log("Term totals:", JSON.stringify(termTotals, null, 2))
    console.log("Calculated max marks:", calculatedMaxMarks)

    setTotalMarks(termTotals)
    setMaxMarks(calculatedMaxMarks)

    // Calculate grand total
    const total = Object.values(termTotals).reduce((sum, termTotal) => sum + termTotal, 0)
    setGrandTotal(total)
    console.log("Grand total:", total)
  }, [examDetails])

  const handleDownload = () => {
    console.log("Downloading result card as image")
    if (resultCardRef.current) {
      toPng(resultCardRef.current, {pixelRatio: 3, quality: 100, cacheBust: true})
        .then((dataUrl) => {
          const link = document.createElement("a")
          link.download = `${studentName}-result-card.png`
          link.href = dataUrl
          link.click()
        })
        .catch((error) => {
          console.error("Error generating image:", error)
        })
    }
  }

  // Function to get subject data for a specific term
  const getSubjectDataForTerm = (subjectName: string, term: { term: string; subjects: examEntrySubject[] }) => {
    console.log(`Getting data for subject ${subjectName} in term ${term.term}`)
    return term.subjects.find((s) => s.name === subjectName)
  }

  // Function to calculate total marks for a subject across all terms
  const calculateTotalForSubject = (subjectName: string) => {
    return termData.reduce((sum, term) => {
      const subjectData = getSubjectDataForTerm(subjectName, term)
      const obtainedMarks = subjectData
        ? (subjectData.obtainedMarksTheory || 0) + (subjectData.obtainedMarksPractical || 0)
        : 0
      return sum + obtainedMarks
    }, 0)
  }

  return (
    <>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-2 mb-4">
          Refresh the page to regenerate the result card.
        </h3>
      <div className="mt-4 mb-6 flex justify-self-start">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button onClick={handleDownload} className="bg-blue-800 hover:bg-blue-900 text-white">
                    Download Result Card
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-blue-800 text-white">
                  Download result card as an image
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
      </div>
    <Card className="w-full border-0 shadow-none bg-white dark:bg-white">
      <CardContent ref={resultCardRef} className="p-0">
        <div className="bg-blue-800 text-white py-4 text-center">
          <h1 className="text-4xl font-bold tracking-wider text-white">DEV ACADEMY</h1>
        </div>
        <div className="bg-gray-100 p-4 text-black dark:text-black">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-black dark:text-black">
                Name: <span className="underline font-medium text-black dark:text-black">{studentName}</span>
              </p>
              <p className="text-sm mt-2 text-black dark:text-black">
                Admission No.: <span className="underline font-medium text-black dark:text-black">_______</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-black dark:text-black">
                Father's Name:{" "}
                <span className="underline font-medium text-black dark:text-black">{fathersName || "_______"}</span>
              </p>
              <p className="text-sm mt-2 text-black dark:text-black">
                Class: <span className="underline font-medium text-black dark:text-black">{className}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-black dark:text-black">
                Section: <span className="underline font-medium text-black dark:text-black">{sectionName}</span>
              </p>
              <p className="text-sm mt-2 text-black dark:text-black">
                D.O.B.: <span className="underline font-medium text-red-600 dark:text-red-600">{dob || "_______"}</span>
              </p>
            </div>
          </div>

          <div className="flex">
            <div className="flex-grow">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-400 bg-gray-200 p-2 text-left font-bold text-black dark:text-black">
                      Subject
                    </th>
                    {termData.map((term, idx) => (
                      <React.Fragment key={term.term}>
                        <th
                          colSpan={3}
                          className="border border-gray-400 bg-gray-200 p-2 text-center font-bold text-black dark:text-black"
                        >
                          Term - {idx + 1}
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="border border-gray-400 bg-gray-200 p-2 text-center font-bold text-black dark:text-black">
                      Total
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-200 p-2 text-black dark:text-black"></th>
                    {termData.map((term) => (
                      <React.Fragment key={`${term.term}-headers`}>
                        <th className="border border-gray-400 bg-gray-200 p-2 text-center text-black dark:text-black">
                          M
                        </th>
                        <th className="border border-gray-400 bg-gray-200 p-2 text-center text-black dark:text-black">
                          Total
                        </th>
                        <th className="border border-gray-400 bg-gray-200 p-2 text-center text-black dark:text-black">
                          %
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="border border-gray-400 bg-gray-200 p-2 text-black dark:text-black"></th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.name}>
                      <td className="border border-gray-400 p-2 text-black dark:text-black">{subject.name}</td>
                      {termData.map((term) => {
                        const subjectData = getSubjectDataForTerm(subject.name, term)
                        const obtainedMarks = subjectData
                          ? (subjectData.obtainedMarksTheory || 0) + (subjectData.obtainedMarksPractical || 0)
                          : 0
                        const totalMarks = subjectData
                          ? (subjectData.totalMarksTheory || 0) + (subjectData.totalMarksPractical || 0)
                          : 0
                        const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0

                        return (
                          <React.Fragment key={`${term.term}-${subject.name}`}>
                            <td className="border border-gray-400 p-2 text-center font-medium text-black dark:text-black">
                              {obtainedMarks || "—"}
                            </td>
                            <td className="border border-gray-400 p-2 text-center text-black dark:text-black">
                              {totalMarks || "—"}
                            </td>
                            <td className="border border-gray-400 p-2 text-center text-black dark:text-black">
                              {percentage || "—"}
                            </td>
                          </React.Fragment>
                        )
                      })}
                      <td className="border border-gray-400 p-2 text-center font-medium text-black dark:text-black">
                        {calculateTotalForSubject(subject.name) || "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td className="border border-gray-400 p-2 font-bold text-black dark:text-black">Total</td>
                    {termData.map((term) => {
                      const termTotal = totalMarks[term.term] || 0
                      const termMaxTotal = term.subjects.reduce(
                        (sum, subject) => sum + ((subject.totalMarksTheory || 0) + (subject.totalMarksPractical || 0)),
                        0,
                      )
                      const termPercentage = termMaxTotal > 0 ? Math.round((termTotal / termMaxTotal) * 100) : 0

                      return (
                        <React.Fragment key={`${term.term}-total`}>
                          <td className="border border-gray-400 p-2 text-center font-bold text-red-600 dark:text-red-600">
                            {termTotal || "—"}
                          </td>
                          <td className="border border-gray-400 p-2 text-center font-bold text-red-600 dark:text-red-600">
                            {termMaxTotal || "—"}
                          </td>
                          <td className="border border-gray-400 p-2 text-center font-bold text-black dark:text-black">
                            {termPercentage || "—"}
                          </td>
                        </React.Fragment>
                      )
                    })}
                    <td className="border border-gray-400 p-2 text-center font-bold text-red-600 dark:text-red-600">
                      {grandTotal || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 text-black dark:text-black">Phy. Edu./Activity</td>
                    {termData.map((term, idx) => (
                      <React.Fragment key={`pe-${idx}`}>
                        <td colSpan={3} className="border border-gray-400 p-2 text-center text-black dark:text-black">
                          <span className="underline">A</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 text-black dark:text-black">Attendance</td>
                    {termData.map((term, idx) => (
                      <React.Fragment key={`attendance-${idx}`}>
                        <td colSpan={3} className="border border-gray-400 p-2 text-center text-black dark:text-black">
                          <span className="underline">198/204</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 text-black dark:text-black">Teacher's Sign</td>
                    {termData.map((term, idx) => (
                      <React.Fragment key={`teacher-${idx}`}>
                        <td colSpan={3} className="border border-gray-400 p-2 text-center text-black dark:text-black">
                          <span className="underline">_________</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 text-black dark:text-black">Parent's Sign</td>
                    {termData.map((term, idx) => (
                      <React.Fragment key={`parent-${idx}`}>
                        <td colSpan={3} className="border border-gray-400 p-2 text-center text-black dark:text-black">
                          <span className="underline">_________</span>
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-48 ml-4">
              <div className="border border-gray-400 mb-4 bg-white">
                <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                  MM
                </div>
                <div className="p-2 text-center text-black dark:text-black">{maxMarks}</div>
              </div>

              {termData.map((term, idx) => (
                <div key={`term-sidebar-${idx}`} className="border border-gray-400 mb-4 bg-white">
                  <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                    Term-{idx + 1}
                  </div>
                  <div className="p-2 text-center text-red-600 dark:text-red-600 font-bold">
                    {totalMarks[term.term] || "—"}
                  </div>
                </div>
              ))}

              <div className="border border-gray-400 mb-4 bg-white">
                <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                  Grand Total
                </div>
                <div className="p-2 text-center text-red-600 dark:text-red-600 font-bold">{grandTotal || "—"}</div>
              </div>

              <div className="border border-gray-400 mb-4 bg-white">
                <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                  REMARKS
                </div>
                <div className="p-4 text-center italic text-black dark:text-black">
                  <div className={"py-12"}></div>
                </div>
              </div>

              <div className="mt-8 text-black dark:text-black">
                <p className="text-sm">At the end of year</p>
                <p className="text-sm mt-2">Promoted to: _______</p>
                <p className="text-sm mt-2">School reopens on: _______</p>
                <p className="text-sm mt-2">Date: _______</p>
                <p className="text-sm mt-8 text-right">PRINCIPAL</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
     
    </Card>
</>
  )
}
