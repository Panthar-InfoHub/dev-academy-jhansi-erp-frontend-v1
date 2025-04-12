"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { examEntry, examEntrySubject } from "@/types/student"
import { subject } from "@/types/classroom";

interface ResultCardProps {
 examDetails: examEntry[]
 subjects: examEntrySubject[]
 studentName: string
 className: string
 sectionName: string
}

export function ResultCard({ examDetails, subjects, studentName, className, sectionName }: ResultCardProps) {
 const [totalMarks, setTotalMarks] = useState<number[]>([])

 useEffect(() => {
   const calculateTotalMarks = () => {
     const termTotals = examDetails.map((term) => {
       return term.subjects.reduce((sum, subject: examEntrySubject) => {
         const theoryMarks = subject.theoryExam ? subject.totalMarksTheory || 0 : 0
         const practicalMarks = subject.practicalExam ? subject.totalMarksPractical || 0 : 0
         return sum + theoryMarks + practicalMarks
       }, 0)
     })
     setTotalMarks(termTotals)
   }

   calculateTotalMarks()
 }, [examDetails])

 return (
   <Card className="w-full border-2 border-gray-200 dark:border-gray-700 shadow-md">
     <CardHeader className="flex flex-col items-center justify-center space-y-2">
       <CardTitle className="text-2xl font-bold text-center">Dev Academy</CardTitle>
       <CardTitle className="text-xl font-semibold text-center">Report Card</CardTitle>
     </CardHeader>
     <CardContent className="grid gap-4">
       <div className="flex justify-between">
         <div>
           <p>
             Name: <span className="underline">{studentName}</span>
           </p>
           <p>
             Class: <span className="underline">{className}</span>
           </p>
         </div>
         <div>
           <p>
             Father's Name: <span className="underline">Mr. Angad Pal</span>
           </p>
           <p>
             Section: <span className="underline">{sectionName}</span>
           </p>
         </div>
         <div>
           <p>
             Admission No.: <span className="underline">...</span>
           </p>
           <p>
             D.O.B: <span className="underline">15-08-2012</span>
           </p>
         </div>
       </div>

       <div className="overflow-x-auto">
         <table className="min-w-full border-collapse border border-gray-400 dark:border-gray-600">
           <thead>
             <tr>
               <th className="border border-gray-400 dark:border-gray-600 px-4 py-2">Subject</th>
               {examDetails.map((term, index) => (
                 <th key={index} className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                   Term - {index + 1}
                 </th>
               ))}
               <th className="border border-gray-400 dark:border-gray-600 px-4 py-2">Total</th>
             </tr>
           </thead>
           <tbody>
             {subjects.map((subject) => (
               <tr key={subject.name}>
                 <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">{subject.name}</td>
                 {examDetails.map((term, index) => {
                   const subjectMarks: examEntrySubject = term.subjects.find((s:examEntrySubject) => s.name === subject.name)
                   const obtainedMarks =
                     (subjectMarks?.obtainedMarksTheory || 0) + (subjectMarks?.obtainedMarksPractical || 0)
                   return (
                     <td key={index} className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                       {obtainedMarks}
                     </td>
                   )
                 })}
                 <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                   {examDetails.reduce((sum, term) => {
                     const subjectMarks: examEntrySubject = term.subjects.find((s: examEntrySubject) => s.name === subject.name)
                     const obtainedMarks =
                       (subjectMarks?.obtainedMarksTheory || 0) + (subjectMarks?.obtainedMarksPractical || 0)
                     return sum + obtainedMarks
                   }, 0)}
                 </td>
               </tr>
             ))}
             <tr>
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">Phy. Edu./Activity</td>
               {examDetails.map((term, index) => (
                 <td key={index} className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                   <span className="underline">...</span>
                 </td>
               ))}
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                 <span className="underline">...</span>
               </td>
             </tr>
             <tr>
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">Attendance</td>
               {examDetails.map((term, index) => (
                 <td key={index} className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                   <span className="underline">...</span>
                 </td>
               ))}
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center"></td>
             </tr>
             <tr>
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">Total</td>
               {examDetails.map((term, index) => (
                 <td key={index} className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                   {totalMarks[index]}
                 </td>
               ))}
               <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-center">
                 {totalMarks.reduce((sum, mark) => sum + mark, 0)}
               </td>
             </tr>
           </tbody>
         </table>
       </div>

       <div className="flex justify-between">
         <p>Percentage: <span className="underline">...</span></p>
         <p>School reopens on: <span className="underline">...</span></p>
       </div>
       <div className="flex justify-between">
         <p>Promoted to: <span className="underline">...</span></p>
         <p>Date: <span className="underline">...</span></p>
       </div>
       <div className="flex justify-between">
         <p>Teacher's Sign: <span className="underline">...</span></p>
         <p>Parent's Sign: <span className="underline">...</span></p>
       </div>
       <div className="flex justify-between">
         <p>Remarks: <span className="underline">...</span></p>
       </div>
     </CardContent>
   </Card>
 )
}