"use server";

import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse, serverResponseParserArguments } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
  AttendanceDetailEntry,
  completeEmployeeAttributes,
  DailyAttendanceResponse,
  EmployeeAttributes
} from "@/types/employee";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

/**
 * Validates the response from fetch, throws with error body if not OK.
 */
async function checkResponse(response: Response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error("Fetch error:", { status: response.status, body: errorBody });
    throw { status: response.status, errorBody };
  }
  return response;
}

// --- EMPLOYEE CRUD ---

export const addNewEmployee = async (formValues: EmployeeAttributes) => {
  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });
    await checkResponse(response);
    const responseBody: completeEmployeeAttributes = await response.json();
    revalidatePath("/dashboard/employee");
    return parseServerResponse({ status: "SUCCESS", message: "Employee Added Successfully" });
  } catch (e: any) {
    console.error("Add Employee Error: ", e);
    return null;
  }
};

export async function updateEmployee(
  formValues: Partial<completeEmployeeAttributes>
): Promise<serverResponseParserArguments<null>> {
  if (!formValues.id) {
    return parseServerResponse({ status: "ERROR", message: "Employee ID is required" });
  }

  try {
    const { id, ...dataToUpdate } = formValues;
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToUpdate)
    });
    await checkResponse(response);
    invalidateCache(`employee-details-${id}`);
    revalidatePath(`/dashboard/employee/${id}`);
    return parseServerResponse({ status: "SUCCESS", message: "Employee Updated Successfully" });
  } catch (e: any) {
    console.error("Update Employee Error: ", e);
    return parseServerResponse({
      status: "ERROR",
      message: e.errorBody?.error || "Failed to update employee",
      data: null
    });
  }
}

export const deleteEmployee = async (employeeId: string) => {
  if (!employeeId) {
    return parseServerResponse({ status: "ERROR", message: "Employee ID is required" });
  }

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    await checkResponse(response);
    invalidateCache(`employee-details-${employeeId}`);
    revalidatePath("/dashboard/employee");
    return parseServerResponse({ status: "SUCCESS", message: "Employee Deleted Successfully" });
  } catch (e: any) {
    console.error("Delete Employee Error: ", e);
    return null;
  }
};


export const fetchEmployeeDetails = async (employeeId: string): Promise<completeEmployeeAttributes | null> => {
  if (!employeeId) return null;

  const cacheKey = `employee-details-${employeeId}`;
  const cachedData = getCache<completeEmployeeAttributes>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}`);
    await checkResponse(response);
    const data = await response.json();
    setCache(cacheKey, data.employee, 60 * 5); // cache for 5 minutes
    return data.employee as completeEmployeeAttributes;
  } catch (e: any) {
    console.error("Fetch Employee Error: ", e);
    return null;
  }
};

export const searchEmployees = async (
  q: string = "",
  page: number,
  limit: number,
  ascending: boolean = false
) => {
  try {
    const params = new URLSearchParams({
      q,
      page: `${Math.max(1, page)}`,
      limit: `${Math.min(Math.max(1, limit), 100)}`,
      ascending: ascending.toString()
    });
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/?${params}`);
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse({
      status: "SUCCESS",
      data: data.employees,
      message: "Data Fetched",
      count: data.count
    });
  } catch (e: any) {
    console.error("Search Employees Error: ", e);
    return null;
  }
};

// --- ATTENDANCE ---

export const getDailyAttendance = async (date: Date) => {
  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/employee/attendance?${new URLSearchParams({
        date: date.toISOString()
      })}`
    );
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse<DailyAttendanceResponse>({
      status: "SUCCESS",
      message: data.message,
      data
    });
  } catch (e: any) {
    console.error("Daily Attendance Error: ", e);
    return parseServerResponse({ status: "ERROR", message: e.errorBody?.error, data: null });
  }
};

export const getEmployeeAttendance = async (
  employeeId: string,
  start_date: Date,
  end_date: Date
) => {
  try {
    const params = new URLSearchParams({
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString()
    });
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/attendance?${params}`);
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse<AttendanceDetailEntry[]>({
      status: "SUCCESS",
      message: data.message,
      data: data.attendance
    });
  } catch (e: any) {
    console.error("Employee Attendance Error: ", e);
    return parseServerResponse({ status: "ERROR", message: e.errorBody?.error, data: null });
  }
};

export interface UpdateAttendanceParams {
  employeeId: string;
  attendanceId: string;
  isPresent: boolean;
  clockInTime?: Date;
  isLeave: boolean;
  isHoliday?: boolean;
  isInvalid?: boolean;
}

export async function updateAttendance({
  employeeId,
  attendanceId,
  isPresent,
  clockInTime,
  isLeave,
  isHoliday = false,
  isInvalid = false
}: UpdateAttendanceParams) {
  const clockInTimeString = clockInTime
    ? `${clockInTime.getHours().toString().padStart(2, "0")}:${clockInTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${clockInTime.getSeconds().toString().padStart(2, "0")}`
    : undefined;

  try {
    const response = await fetch(
      `${BACKEND_SERVER_URL}/v1/employee/${employeeId}/attendance/${attendanceId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPresent, clockInTime: clockInTimeString, isLeave, isHoliday, isInvalid })
      }
    );
    await checkResponse(response);
    const data = await response.json();
    revalidatePath(`/dashboard/employee/${employeeId}/attendance`);
    return parseServerResponse({
      status: "SUCCESS",
      message: "Attendance Updated Successfully",
      data: data.attendanceData
    });
  } catch (e: any) {
    console.error("Update Attendance Error:", e);
    revalidatePath("/dashboard/employees/attendance-report");
    return parseServerResponse({ status: "ERROR", message: e.errorBody?.error, data: null });
  }
}

// --- HOLIDAY SETTING ---

export async function setDateAsHoliday(date: Date) {
  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/attendance/set-date-as-holiday`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date })
    });
    await checkResponse(response);
    const data = await response.json();
    revalidatePath("/dashboard/employees/attendance-report");
    return parseServerResponse({
      status: "SUCCESS",
      message: data.message,
      data: data.affectedCount
    });
  } catch (e: any) {
    console.error("Set Holiday Error: ", e);
    return parseServerResponse({ status: "ERROR", message: e.errorBody?.error, data: null });
  }
}

// --- ADMIN CONTROLS ---

export async function makeAdmin(employeeId: string, targetEmployeeId: string) {
  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/make-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetEmployeeId })
    });
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse({ status: "SUCCESS", message: data.message, data: null });
  } catch (e: any) {
    console.error("Make Admin Error: ", e);
    return parseServerResponse({
      status: e.status === 409 ? "SUCCESS" : "ERROR",
      message: e.errorBody?.error,
      data: null
    });
  }
}

export async function removeAdmin(employeeId: string, targetEmployeeId: string) {
  try {
    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/remove-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetEmployeeId })
    });
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse({ status: "SUCCESS", message: data.message, data: null });
  } catch (e: any) {
    console.error("Remove Admin Error: ", e);
    return parseServerResponse({
      status: e.status === 409 ? "SUCCESS" : "ERROR",
      message: e.errorBody?.error,
      data: null
    });
  }
}

// --- PROFILE IMAGE ---

export async function updateEmployeeProfileImage(employeeId: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("profile_img", file);

    const response = await fetch(`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/image`, {
      method: "POST",
      body: formData
    });
    await checkResponse(response);
    const data = await response.json();
    return parseServerResponse({ status: "SUCCESS", message: data.message, data: null });
  } catch (e: any) {
    console.error("Update Profile Image Error: ", e);
    return parseServerResponse({ status: "ERROR", message: e.errorBody?.error, data: null });
  }
}
