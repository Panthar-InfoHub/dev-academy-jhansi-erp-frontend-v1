"use server"

import { BACKEND_SERVER_URL } from "@/env";
import axios from "axios";
import { AllAdminDetailsResponse } from "@/types/admin";
import { parseServerResponse } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getAllAdmins() {
  
  console.log("Getting all admins")
  
  try {
    const response = await axios.get(
      `${BACKEND_SERVER_URL}/v1/employee/admins`
    )
    
    console.log("Response from getAllAdmins: ", response.data)
    
    return parseServerResponse<AllAdminDetailsResponse>({
      status: "SUCCESS",
      message: "All Admins Fetched Successfully",
      data: response.data
    })
    
  }
  catch (e) {
    console.error(`Failed to get all admins`, JSON.stringify(e))
    return parseServerResponse<null>({
      status: "ERROR",
      message: "Failed to get all admins",
      data: null
    })
  }
  
}

export async function generateDailyAttendanceEntries() {
  
  console.log("Generating daily attendance entries")
  
  try {
    const response = await axios.post(
      `${BACKEND_SERVER_URL}/v1/employee/attendance/generate`
    )
    
    console.log("Response from generateDailyAttendanceEntries: ", response.data)
    revalidatePath("/dashboard/employee/attendance")
    return parseServerResponse<null>({
      status: "SUCCESS",
      message: "Daily Attendance Entries Generated Successfully",
      data: null
    })
  }
  catch (e) {
    console.error(`Failed to generate daily attendance entries`, JSON.stringify(e))
    return parseServerResponse<null>({
      status: "ERROR",
      message: "Failed to generate daily attendance entries",
      data: null
    })
  }
  
}