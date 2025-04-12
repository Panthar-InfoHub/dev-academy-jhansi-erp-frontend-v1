"use server"

import CheckInHandler from "@/components/employees/CheckInHandler";
import { redirect } from "next/navigation";
import { auth } from "@/auth";


export default async function  EmployeeCheckInPage() {
  
  const  session  = await auth()
  
  
  if (!session || !session.user) {
    return redirect("/")
  }
  
  const employeeId = session.user.id
  
  return (
    <>
    <CheckInHandler employeeId={employeeId} />
    </>
  )
}
