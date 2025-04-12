"use client"

import { useState, useEffect } from "react"
import type { completeStudentEnrollment, examEntry } from "@/types/student"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Copy, UserPlus, RefreshCw, Receipt, MoreHorizontal, Loader2 } from "lucide-react"
import { BACKEND_SERVER_URL } from "@/env"
import { deleteStudent, getStudentPaymentsInfo } from "@/lib/actions/student"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CreateExamDialog } from "./create-exam-dialog"
import { UpdateExamDialog } from "./update-exam-dialog"
import { deleteExamEntry } from "@/lib/actions/student"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PayFeesDialog } from "./pay-fees-dialog"
import { ResultCard } from "./result-card"
import { useRouter } from "next/navigation"
import { TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EnrollmentDetailProps {
  enrollment: completeStudentEnrollment
  studentId: string
}

export function EnrollmentDetail({ enrollment, studentId }: EnrollmentDetailProps) {
 const [activeTab, setActiveTab] = useState("details")
 const [isDeleting, setIsDeleting] = useState(false)
 const [isTogglingStatus, setIsTogglingStatus] = useState(false)
 const [editDialogOpen, setEditDialogOpen] = useState(false)
 const [newEnrollmentDialogOpen, setNewEnrollmentDialogOpen] = useState(false)
 const [studentData, setStudentData] = useState<any>(enrollment.student)
 const [payments, setPayments] = useState<any[]>([])
 const [isLoadingPayments, setIsLoadingPayments] = useState(false)
 const [paymentsPage, setPaymentsPage] = useState(1)
 const [paymentsLimit] = useState(10)
 const [totalPayments, setTotalPayments] = useState(0)
 const [totalPages, setTotalPages] = useState(1)
 const [selectedPayment, setSelectedPayment] = useState<any>(null)
 const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
 const [isDeletingEnrollment, setIsDeletingEnrollment] = useState(false)
 const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false)
 const [updateExamDialogOpen, setUpdateExamDialogOpen] = useState(false)
 const [selectedExam, setSelectedExam] = useState<examEntry | null>(null)
 const [isPayingFees, setIsPayingFees] = useState(false)
 const [isGeneratingResult, setIsGeneratingResult] = useState(false)
 const [showResultCard, setShowResultCard] = useState(false)
 const [page, setPage] = useState(1)

 const router = useRouter()

 const fetchPayments = async () => {
   setIsLoadingPayments(true)
   try {
     const result = await getStudentPaymentsInfo(studentId, paymentsLimit, paymentsPage)
     if (result?.status === "SUCCESS" && result.data) {
       setPayments(result.data.payments || [])
       setTotalPayments(result.data.totalItems || 0)
       setTotalPages(result.data.totalPages || 1)
     } else {
       toast.error(result?.message || "Failed to fetch payment information")
     }
   } catch (error) {
     console.error("Error fetching payments:", error)
     toast.error("An error occurred while fetching payment information")
   } finally {
     setIsLoadingPayments(false)
   }
 }

 useEffect(() => {
   if (activeTab === "payments") {
     fetchPayments()
   }
 }, [activeTab, paymentsPage])

 const handleDeleteEnrollment = async () => {
   setIsDeletingEnrollment(true)

   toast.promise(deleteStudent(studentId, false), {
     loading: "Deleting enrollment...",
     success: (result) => {
       if (result?.status === "SUCCESS") {
         router.push(`/dashboard/student/${studentId}`)
         return result.message || "Enrollment deleted successfully"
       } else {
         throw new Error(result?.message || "Failed to delete enrollment")
       }
     },
     error: (error) => {
       console.error("Error deleting enrollment:", error)
       return "An error occurred while deleting enrollment"
     },
     finally: () => {
       setIsDeletingEnrollment(false)
     },
   })
 }

 const handleCopyId = (id: string) => {
   navigator.clipboard.writeText(id)
   toast.success("ID copied to clipboard")
 }

 const handleStudentUpdated = (updatedStudent: any) => {
   setStudentData(updatedStudent)
   toast.success("Student updated successfully")
 }

 const handleEnrollmentCreated = () => {
   router.refresh()
   toast.success("Enrollment created successfully")
 }

 const handleCreateExam = () => {
   setCreateExamDialogOpen(true)
 }

 const handleUpdateExam = (exam: examEntry) => {
   setSelectedExam(exam)
   setUpdateExamDialogOpen(true)
 }

 const handleDeleteExam = async (examEntryId: string) => {
   toast.promise(deleteExamEntry(studentId, enrollment.id, examEntryId), {
     loading: "Deleting exam entry...",
     success: (result) => {
       if (result?.status === "SUCCESS") {
         router.refresh()
         return "Exam entry deleted successfully"
       } else {
         throw new Error(result?.message || "Failed to delete exam entry")
       }
     },
     error: (error) => {
       console.error("Error deleting exam entry:", error)
       return "An error occurred while deleting exam entry"
     },
   })
 }

 const handlePayFees = () => {
   setIsPayingFees(true)
 }

 const handleGenerateResult = () => {
   setIsGeneratingResult(true)
   setShowResultCard(true)
 }

 return (
   <div className="space-y-6">
     <div className="flex justify-between items-center">
       <Button variant="outline" onClick={() => router.push(`/dashboard/student/${studentId}`)}>
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Student
       </Button>

       <div className="flex flex-wrap gap-2">
         <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
           <Pencil className="mr-2 h-4 w-4" />
           Edit Enrollment
         </Button>
         <AlertDialog>
           <AlertDialogTrigger asChild>
             <Button variant="destructive">
               <Trash2 className="mr-2 h-4 w-4" />
               Delete Enrollment
             </Button>
           </AlertDialogTrigger>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Are you sure you want to delete this enrollment?</AlertDialogTitle>
               <AlertDialogDescription>
                 This action cannot be undone. This will permanently delete the enrollment and all associated data.
               </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteEnrollment} className="bg-red-600 hover:bg-red-700">
               {isDeletingEnrollment ? "Deleting..." : "Delete"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   </div>

   <div className="flex flex-col md:flex-row gap-6 items-start">
     <div className="relative">
       <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
         <AvatarImage src={BACKEND_SERVER_URL + `/v1/student/${studentId || "/placeholder.svg"}/profileImg`} alt={studentData?.name} />
         <AvatarFallback className="text-2xl md:text-3xl">{studentData?.name}</AvatarFallback>
       </Avatar>
     </div>

     <div className="flex-1 space-y-2">
       <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold">{studentData?.name}</h1>
           <div className="flex items-center gap-2 mt-1">
             <Badge variant={enrollment.isActive ? "default" : "outline"}>
               {enrollment.isActive ? "Active" : "Inactive"}
             </Badge>
             <Badge variant={enrollment.isComplete ? "default" : "secondary"} className="bg-orange-500">
               {enrollment.isComplete ? "Completed" : "In Progress"}
             </Badge>
           </div>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-sm text-muted-foreground">ID: {enrollment.id}</span>
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyId(enrollment.id)}>
               <Copy className="h-3.5 w-3.5" />
             </Button>
           </div>
         </div>
       </div>
     </div>
   </div>

   <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
     <TabsList className="grid w-full grid-cols-3">
       <TabsTrigger value="details">Enrollment Details</TabsTrigger>
       <TabsTrigger value="exams">Exams</TabsTrigger>
       <TabsTrigger value="payments">Payments</TabsTrigger>
     </TabsList>

     <TabsContent value="details" className="mt-4 space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
           <CardHeader>
             <CardTitle>Enrollment Information</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">Class</span>
               <span className="font-medium text-right">{enrollment.classRoom?.name}</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">Section</span>
               <span className="font-medium text-right">{enrollment.classSection?.name}</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">Session Start</span>
               <span className="font-medium text-right">
                 {format(new Date(enrollment.sessionStart), "MMMM do, yyyy")}
               </span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">Session End</span>
               <span className="font-medium text-right">
                 {format(new Date(enrollment.sessionEnd), "MMMM do, yyyy")}
               </span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">Monthly Fee</span>
               <span className="font-medium text-right">₹{enrollment.monthlyFee.toLocaleString()}</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <span className="text-muted-foreground">One-time Fee</span>
               <span className="font-medium text-right">₹{enrollment.one_time_fee?.toLocaleString()}</span>
             </div>
           </CardContent>
         </Card>
       </div>
     </TabsContent>

     <TabsContent value="exams" className="mt-4 space-y-4">
       <Card>
         <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Exam Details</CardTitle>
             <Button variant="outline" size="sm" onClick={handleCreateExam}>
               <UserPlus className="mr-2 h-4 w-4" />
               New Exam
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {enrollment.examDetails && enrollment.examDetails.length > 0 ? (
             <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                 <thead>
                   <tr className="border-b">
                     <TableHead>Exam Name</TableHead>
                     <TableHead>Exam Type</TableHead>
                     <TableHead>Exam Date</TableHead>
                     <TableHead>Note</TableHead>
                     <TableHead>Actions</TableHead>
                   </tr>
                 </thead>
                 <TableBody>
                   {enrollment.examDetails.map((exam) => (
                     <TableRow key={exam.examEntryId}>
                       <TableCell>{exam.examName}</TableCell>
                       <TableCell>{exam.examType}</TableCell>
                       <TableCell>{format(new Date(exam.examDate), "MMMM do, yyyy")}</TableCell>
                       <TableCell>{exam.note}</TableCell>
                       <TableCell>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleUpdateExam(exam)}>
                               <Pencil className="mr-2 h-4 w-4" />
                               Edit
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDeleteExam(exam.examEntryId)} className="text-red-600">
                               <Trash2 className="mr-2 h-4 w-4" />
                               Delete
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </table>
             </div>
           ) : (
             <div className="text-center py-6">
               <p className="text-muted-foreground">No exam details found for this enrollment</p>
             </div>
           )}
         </CardContent>
       </Card>
       <Button onClick={handleGenerateResult} disabled={isGeneratingResult}>
         {isGeneratingResult ? "Generating Result..." : "Generate Result"}
       </Button>
       {showResultCard && (
         <ResultCard
           examDetails={enrollment.examDetails}
           subjects={enrollment.subjects}
           studentName={studentData.name}
           className={enrollment.classRoom?.name}
           sectionName={enrollment.classSection?.name}
         />
       )}
     </TabsContent>

     <TabsContent value="payments" className="mt-4 space-y-4">
       <Card>
         <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Payment History</CardTitle>
             <Button variant="outline" size="sm" onClick={fetchPayments} disabled={isLoadingPayments}>
               <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPayments ? "animate-spin" : ""}`} />
               Refresh
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {isLoadingPayments ? (
             <div className="flex justify-center py-8">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
           ) : payments.length > 0 ? (
             <>
               <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="border-b">
                       <TableHead>Date</TableHead>
                       <TableHead>Amount</TableHead>
                       <TableHead>Original Balance</TableHead>
                       <TableHead>Remaining Balance</TableHead>
                       <TableHead className="w-[150px]">Actions</TableHead>
                     </tr>
                   </thead>
                   <tbody>
                     {payments.map((payment, index) => (
                       <TableRow key={index} className="border-b">
                         <TableCell>{format(new Date(payment.paidOn), "MMM d, yyyy")}</TableCell>
                         <TableCell>₹{payment.paidAmount.toLocaleString()}</TableCell>
                         <TableCell>₹{payment.originalBalance.toLocaleString()}</TableCell>
                         <TableCell>₹{payment.remainingBalance.toLocaleString()}</TableCell>
                         <TableCell>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setSelectedPayment(payment)
                               setReceiptDialogOpen(true)
                             }}
                             className="flex items-center gap-1"
                           >
                             <Receipt className="h-4 w-4" />
                             Receipt
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </tbody>
                 </table>
               </div>

               {totalPayments > paymentsLimit && (
                 <div className="flex items-center justify-between mt-4">
                   <p className="text-sm text-muted-foreground">
                     Showing {payments.length} of {totalPayments} payments
                   </p>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setPage((p) => Math.max(1, p - 1))}
                       disabled={page === 1 || isLoadingPayments}
                     >
                       Previous
                     </Button>
                     <span className="text-sm">
                       Page {page} of {totalPages}
                     </span>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setPage((p) => p + 1)}
                       disabled={page >= totalPages || isLoadingPayments}
                     >
                       Next
                     </Button>
                   </div>
                 </div>
               )}
             </>
           ) : (
             <p className="text-center py-6 text-muted-foreground">No payment records found for this student</p>
           )}
         </CardContent>
       </Card>
     </TabsContent>

     <CreateExamDialog
       open={createExamDialogOpen}
       onOpenChange={setCreateExamDialogOpen}
       studentId={studentId}
       enrollmentId={enrollment.id}
       onSuccess={() => router.refresh()}
     />

     <UpdateExamDialog
       open={updateExamDialogOpen}
       onOpenChange={setUpdateExamDialogOpen}
       studentId={studentId}
       enrollmentId={enrollment.id}
       exam={selectedExam}
       onSuccess={() => router.refresh()}
     />

     <PayFeesDialog
       enrollment={enrollment}
       open={isPayingFees}
       onOpenChange={setIsPayingFees}
       studentId={studentId}
       onSuccess={() => router.refresh()}
     />
   </Tabs>
   </div >
 )
}
