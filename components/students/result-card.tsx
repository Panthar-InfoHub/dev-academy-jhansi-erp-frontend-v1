"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { toPng } from "html-to-image"
import type { examEntry, examEntrySubject } from "@/types/student"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      examName: string
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
            examName: exam.examName,
            subjects: [],
          }
        }

        // Add subjects to this term
        acc[exam.term].subjects = [...acc[exam.term].subjects, ...exam.subjects]
        return acc
      },
      {} as { [term: string]: { term: string; examName: string; subjects: examEntrySubject[] } },
    )

    console.log("Grouped by term:", JSON.stringify(groupedByTerm, null, 2))

    // Convert to array and sort by term
    const termsArray = Object.values(groupedByTerm)

    // Limit to 3 terms maximum
    const limitedTerms = termsArray.slice(0, 3)

    setTermData(limitedTerms)

    // Calculate total marks for each term
    const termTotals: { [term: string]: number } = {}
    let calculatedMaxMarks = 0

    limitedTerms.forEach((term) => {
      const total = term.subjects.reduce((sum, subject) => {
        // Combine theory and practical marks
        const obtainedMarks = (subject.obtainedMarksTheory || 0) + (subject.obtainedMarksPractical || 0)
        return sum + obtainedMarks
      }, 0)

      // Calculate max marks from the first term's total possible marks
      if (calculatedMaxMarks === 0) {
        calculatedMaxMarks = term.subjects.reduce((sum, subject) => {
          const totalMarks = (subject.totalMarksTheory || 0) + (subject.totalMarksPractical || 0)
          return sum + totalMarks
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
      toPng(resultCardRef.current, { pixelRatio: 3, quality: 100, cacheBust: true })
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
  const getSubjectDataForTerm = (
    subjectName: string,
    term: { term: string; examName: string; subjects: examEntrySubject[] },
  ) => {
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
      <div className="mt-4 mb-6 flex justify-self-start">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button onClick={handleDownload} className="bg-blue-800 hover:bg-blue-900 text-white">
                Download Result Card
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-blue-800 text-white">Download result card as an image</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Card className="w-full border-0 shadow-none bg-white dark:bg-white">
        <CardContent ref={resultCardRef} className="p-0">
          <div className="w-[1000px] h-auto bg-white dark:bg-white">
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
                    D.O.B.:{" "}
                    <span className="underline font-medium text-red-600 dark:text-red-600">{dob || "_______"}</span>
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
                        {/* Always show 3 terms, regardless of how many are in termData */}
                        {[0, 1, 2].map((idx) => (
                          <th
                            key={`term-header-${idx}`}
                            className="border border-gray-400 bg-gray-200 p-2 text-center font-bold text-black dark:text-black"
                          >
                            Term {idx + 1}
                          </th>
                        ))}
                        <th className="border border-gray-400 bg-gray-200 p-2 text-center font-bold text-black dark:text-black">
                          Total
                        </th>
                      </tr>
                      <tr>
                        <th className="border border-gray-400 bg-gray-200 p-2 text-start text-black dark:text-black">MM</th>
                        {/* Show max marks for each term */}
                        {[0, 1, 2].map((idx) => {
                          const term = termData[idx]
                          const termMaxTotal = term
                            ? term.subjects.reduce(
                                (sum, subject) =>
                                  sum + ((subject.totalMarksTheory || 0) + (subject.totalMarksPractical || 0)),
                                0,
                              )
                            : 0

                          return (
                            <th
                              key={`term-max-${idx}`}
                              className="border border-gray-400 bg-gray-200 p-2 text-center text-black dark:text-black"
                            >
                              {termMaxTotal || "—"}
                            </th>
                          )
                        })}
                        <th className="border border-gray-400 bg-gray-200 p-2 text-black dark:text-black"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr key={subject.name}>
                          <td className="border border-gray-400 p-2 text-black dark:text-black">{subject.name}</td>
                          {/* Always show 3 terms */}
                          {[0, 1, 2].map((idx) => {
                            const term = termData[idx]
                            const subjectData = term ? getSubjectDataForTerm(subject.name, term) : null
                            const obtainedMarks = subjectData
                              ? (subjectData.obtainedMarksTheory || 0) + (subjectData.obtainedMarksPractical || 0)
                              : 0

                            return (
                              <td
                                key={`term-${idx}-${subject.name}`}
                                className="border border-gray-400 p-2 text-center font-medium text-black dark:text-black"
                              >
                                {term ? obtainedMarks || "—" : "—"}
                              </td>
                            )
                          })}
                          <td className="border border-gray-400 p-2 text-center font-medium text-black dark:text-black">
                            {calculateTotalForSubject(subject.name) || "—"}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100">
                        <td className="border border-gray-400 p-2 font-bold text-black dark:text-black">Total</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => {
                          const term = termData[idx]
                          const termTotal = term ? totalMarks[term.term] || 0 : 0

                          return (
                            <td
                              key={`term-total-${idx}`}
                              className="border border-gray-400 p-2 text-center font-bold text-red-600 dark:text-red-600"
                            >
                              {term ? termTotal || "—" : "—"}
                            </td>
                          )
                        })}
                        <td className="border border-gray-400 p-2 text-center font-bold text-red-600 dark:text-red-600">
                          {grandTotal || "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-black dark:text-black">Percentage</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => {
                          const term = termData[idx]
                          let termPercentage = 0

                          if (term) {
                            const termTotal = totalMarks[term.term] || 0
                            const termMaxTotal = term.subjects.reduce(
                              (sum, subject) =>
                                sum + ((subject.totalMarksTheory || 0) + (subject.totalMarksPractical || 0)),
                              0,
                            )
                            termPercentage = termMaxTotal > 0 ? Math.round((termTotal / termMaxTotal) * 100) : 0
                          }

                          return (
                            <td
                              key={`term-percentage-${idx}`}
                              className="border border-gray-400 p-2 text-center text-black dark:text-black"
                            >
                              {term ? termPercentage || "—" : "—"}%
                            </td>
                          )
                        })}
                        <td className="border border-gray-400 p-2 text-center font-medium text-black dark:text-black">
                          {maxMarks > 0 ? Math.round((grandTotal / maxMarks) * 100) || "—" : "—"}%
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-black dark:text-black">Phy. Edu./Activity</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => (
                          <td
                            key={`pe-${idx}`}
                            className="border border-gray-400 p-2 text-center text-black dark:text-black"
                          >
                            {/*<span className="underline">A</span>*/}
                          </td>
                        ))}
                        <td className="border border-gray-400 p-2"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-black dark:text-black">Attendance</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => (
                          <td
                            key={`attendance-${idx}`}
                            className="border border-gray-400 p-2 text-center text-black dark:text-black"
                          >
                            {/*<span className="underline">198/204</span>*/}
                          </td>
                        ))}
                        <td className="border border-gray-400 p-2"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-black dark:text-black">Teacher's Sign</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => (
                          <td
                            key={`teacher-${idx}`}
                            className="border border-gray-400 p-2 text-center text-black dark:text-black"
                          >
                            {/*<span className="underline">_________</span>*/}
                          </td>
                        ))}
                        <td className="border border-gray-400 p-2"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-black dark:text-black">Parent's Sign</td>
                        {/* Always show 3 terms */}
                        {[0, 1, 2].map((idx) => (
                          <td
                            key={`parent-${idx}`}
                            className="border border-gray-400 p-2 text-center text-black dark:text-black"
                          >
                            {/*<span className="underline">_________</span>*/}
                          </td>
                        ))}
                        <td className="border border-gray-400 p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-48 ml-4">
                  <div className="grid grid-cols-2 border border-gray-400 mb-4 bg-white">
                    <div className="border-b border-r border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                      O.M
                    </div>
                    <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                      M.M
                    </div>
                    <div className="border-r border-gray-400 p-2 text-center text-red-600 dark:text-red-600 font-bold">
                      {grandTotal || "—"}
                    </div>
                    <div className="p-2 text-center text-black dark:text-black">{maxMarks}</div>
                  </div>

                  {/* Always show 3 term boxes in the sidebar */}
                  {[0, 1, 2].map((idx) => {
                    const term = termData[idx]
                    const termTotal = term ? totalMarks[term.term] || 0 : 0

                    return (
                      <div key={`term-sidebar-${idx}`} className="border border-gray-400 mb-4 bg-white">
                        <div className="border-b border-gray-400 p-2 text-center font-bold bg-gray-200 text-black dark:text-black">
                          Term-{idx + 1}
                        </div>
                        <div className="p-2 text-center text-red-600 dark:text-red-600 font-bold">
                          {term ? termTotal || "—" : "—"}
                        </div>
                      </div>
                    )
                  })}

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
                    <div className="p-2 text-left italic text-black dark:text-black">
                      <p className="mb-2">
                        I Term: <span className="ml-2">
                        {/*Excellent*/}
                      </span>
                      </p>
                      <p className="mb-2">
                        II Term: <span className="ml-2">
                        {/*Excellent*/}
                      </span>
                      </p>
                      <p className="mb-2">
                        Final: <span className="ml-2"></span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer section with evenly spaced items */}
              <div className="mt-6 border-t border-gray-300 pt-4">
                <div className="grid grid-cols-4 gap-4 text-black dark:text-black">
                  <div className="text-center">
                    <p className="text-sm font-medium">At the end of the year</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm">
                      {/*Promoted to: <span className="underline">_______</span>*/}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm">
                      {/*Date: <span className="underline">_______</span>*/}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">PRINCIPAL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
