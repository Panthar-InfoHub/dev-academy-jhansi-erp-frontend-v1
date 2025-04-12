"use server"
import axios, { AxiosError } from "axios";
import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse, serverResponseParserArguments } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
	AttendanceDetailEntry,
	completeEmployeeAttributes,
	DailyAttendanceResponse,
	EmployeeAttributes
} from "@/types/employee";

//Completed
export const addNewEmployee = async (formValues: EmployeeAttributes) => {

	console.debug("Form values inside addNewEmp: ", formValues)

	try {
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/employee/new`,
			{
				...formValues
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			})

		const responseBody: completeEmployeeAttributes = response.data
		console.debug("Response body from addNewEmp: ", responseBody)

		revalidatePath("/dashboard/employee")
		// UX: Show a success toast.
		return parseServerResponse({ status: "SUCCESS", message: "Employee Added Successfully" })

	}
	catch (e) {
		console.error("Failed to add new employee with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Add New Employee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 500: {
						console.debug("Internal Server Error")
						break;
					}
					case 400: {
						console.debug("Bad Request")
						break;
					}
					case 401: {
						console.debug("Unauthorized")
						break;
					}
					case 403: {
						console.debug("Forbidden")
						break;
					}
					case 409: {
						console.debug("Conflict")
						break;
					}
				}

			}
		}

		// UX: Show a toast in this section for good UX.

		return null
	}
}

//Completed
export async function updateEmployee (formValues: Partial<completeEmployeeAttributes>): Promise<serverResponseParserArguments<null>> {

	console.debug("Form values inside updateEmployee: ", formValues)

	if (!formValues.id) {
		return parseServerResponse({ status: "ERROR", message: "Employee ID is required" })
	}

	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/employee/${formValues.id}`,
			{
				...formValues, id: undefined
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			})

		const responseBody: completeEmployeeAttributes = response.data
		console.debug("Response body from updateEmployee: ", responseBody)
		// UX: Show a success toast.
		revalidatePath(`dashboard/employee/${formValues.id}`)
		return parseServerResponse<null>({ status: "SUCCESS", message: "Employee Updated Successfully" })

	}
	catch (e) {
		console.error("Failed to update employee with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Employee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody: JSON.stringify(responseBody) })
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})

			}
		}

		// UX: Show a toast in this section for good UX.

		return null
	}
}

//Completed
export const deleteEmployee = async (employeeId: string) => {

	console.debug("Employee ID to delete: ", employeeId)

	if (!employeeId) {
		return parseServerResponse({ status: "ERROR", message: "Employee ID is required" })
	}

	try {
		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			})

		const responseBody = response.data
		console.debug("Response body from deleteEmployee: ", responseBody)
		// UX: Show a success toast.
		revalidatePath("/dashboard/employee")
		return parseServerResponse({ status: "SUCCESS", message: "Employee Deleted Successfully" })

	}
	catch (e) {
		console.error("Failed to update employee with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Employee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 500: {
						console.debug("Internal Server Error")
						break;
					}
					case 400: {
						console.debug("Bad Request")
						break;
					}
					case 404: {
						console.debug("Employee Not Found")
						break;
					}
				}

			}
		}

		// UX: Show a toast in this section for good UX.

		return null
	}
}

//Completed 
export const fetchEmployeeDetails = async (employeeId: string): Promise<completeEmployeeAttributes> => {

	console.debug("Employee ID to fetch: ", employeeId)

	if (!employeeId) {
		console.debug("Employee ID is required.")
		return
	}

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}`,
		)

		const employeeData: completeEmployeeAttributes = response.data.employee
		console.debug("Response from fetchEmployeeDetails: ", response.data)
		// UX: Show a success toast.
		return employeeData

	}
	catch (e) {
		console.error(`Failed to find employee with id ${employeeId} with the following error: `, e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Find Employee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 500: {
						console.debug("Internal Server Error")
						break;
					}
					case 400: {
						console.debug("Bad Request")
						break;
					}
					case 404: {
						console.debug("Employee Not Found")
						break;
					}
				}

			}
		}

		// UX: Show a toast in this section for good UX.
		return null
	}


}

//Completed
export const searchEmployees = async (q: string = "", page: number, limit: number, ascending: boolean = false) => {
	console.debug("Searching for employees", { q, page, limit, ascending })

	if (page < 1) page = 1
	if (limit < 1) limit = 10
	if (limit > 100) limit = 100

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/employee/`,
			{
				params: {
					q,
					page,
					limit,
					ascending
				}
			}
		)

		const count = response.data.count
		const employeesData: completeEmployeeAttributes[] = response.data.employees
		console.debug("Response from searchEmployees: ", response.data)
		// UX: Show a success toast.

		return parseServerResponse({ status: "SUCCESS", data: employeesData, message: "Data Fetched", count })
	}
	catch (e) {
		console.error(`Failed to search employees with data`, { q, limit, page, ascending }, `with the following error: `, e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Search Employee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 500: {
						console.debug("Internal Server Error")
						break;
					}
					case 400: {
						console.debug("Bad Request")
						break;
					}
				}

			}
		}

		// UX: Show a toast in this section for good UX.

		return null
	}


}

//Completed
export const getDailyAttendance = async (date: Date) => {
	console.debug("Getting daily attendance for date: ", date)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/employee/attendance`,
			{
				params: {
					date
				}
			}
		)

		console.debug("Response from getDailyAttendance: ", response.data)

		return parseServerResponse<DailyAttendanceResponse>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data as DailyAttendanceResponse
		})

	}
	catch (e) {
		console.error(`Failed to get daily attendance for date: ${date}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Get Daily Attendance Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}
}

export const getEmployeeAttendance = async (employeeId: string, start_date: Date, end_date: Date) => {

	console.log("Attempting to get employee attendance for employee: ", employeeId, "on date: ", start_date, end_date)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/attendance`,
			{
				params: {
					start_date, end_date
				}
			}
		)

		console.debug("Response from getEmployeeAttendance: ", response.data)

		return parseServerResponse<AttendanceDetailEntry[]>({
			status: "SUCCESS",
			message: response.data.message,
			data: (response.data as DailyAttendanceResponse).attendance
		})
	}
	catch (e) {
		console.error(`Failed to get employee attendance for employee: ${employeeId} on range ${start_date}, ${end_date}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Get Employee Attendance Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}

	}


}

export async function setDateAsHoliday(date: Date) {

	console.log("Setting date as holiday: ", date)

	try {

		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/employee/attendance/set-date-as-holiday`,
			{
				date
			},
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		)

		return parseServerResponse({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.affectedCount as number
		})

	}
	catch (e) {
		console.error(`Failed to set date as holiday: ${date}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Set Date as Holiday Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}

	}

}

/*
* Admin operations
* */

//Completed
export async function makeAdmin(employeeId: string, targetEmployeeId: string) {

	console.log("Attempting to grant admin permission to employee: ", targetEmployeeId, "as admin employee: ", employeeId)

	try {

		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/make-admin`,
			{
				targetEmployeeId
			},
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		)

		console.log("Response body from makeAdmin request", response.data)

		return parseServerResponse<null>({
			status: "SUCCESS",
			message: response.data.message,
			data: null
		})
	}
	catch (e) {
		console.error(`Failed to grant admins permissions`, { employeeId, targetEmployeeId }, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Grant admin permissions Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 409:
						return parseServerResponse<null>({
							status: "SUCCESS",
							message: responseBody.error,
						})
					default:
						return parseServerResponse<null>({
							status: "ERROR",
							message: responseBody.error,
							data: null
						})
				}
			}
		}
	}


}

//Completed
export async function removeAdmin(employeeId: string, targetEmployeeId: string) {

	console.log("Attempting to remove admin permission from employee: ", targetEmployeeId, "as admin employee: ", employeeId)

	try {

		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/remove-admin`,
			{
				targetEmployeeId
			},
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		)

		console.log("Response Body from removeAdmin request", response.data)

		return parseServerResponse<null>({
			status: "SUCCESS",
			message: response.data.message,
			data: null
		})
	}
	catch (e) {
		console.error(`Failed to remove admins permissions`, { employeeId, targetEmployeeId }, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Remove admin permissions Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })

				switch (responseStatusCode) {
					case 409:
						return parseServerResponse<null>({
							status: "SUCCESS",
							message: responseBody.error,
						})
					default:
						return parseServerResponse<null>({
							status: "ERROR",
							message: responseBody.error,
							data: null
						})
				}
			}
		}
	}


}

/*
* Profile Image
* */

export async function updateEmployeeProfileImage(employeeId: string, file:File) {
	
	console.log("Attempting to update employee profile image: ", employeeId, file)
	
	try {
		const formData = new FormData()
    
    // Append the file to the FormData with the field name 'profile_img'
    formData.append('profile_img', file)

		
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/image`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data"
				},
			}
		)
		
		console.log("Response body from updateEmployeeProfileImage request", response.data)
		
		return parseServerResponse<null>({
			status: "SUCCESS",
			message: response.data.message,
			data: null
		})
		
	}
	catch (e) {
		console.error(`Failed to update employee profile image: ${employeeId}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Employee Profile Image Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", { errStatus, responseStatusCode, responseBody })
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	
	}
}


export interface UpdateAttendanceParams {
	employeeId: string;
	attendanceId: string;
	isPresent: boolean;
	clockInTime?: Date;
	isLeave: boolean;
	isHoliday?: boolean;
	isInvalid?: boolean;
}

/**
 * Updates an existing attendance entry for an employee
 * @param params - Parameters for updating attendance
 * @returns A response with success or error status
 */
export async function updateAttendance(params: UpdateAttendanceParams) {
	const {
		employeeId,
		attendanceId,
		isPresent,
		clockInTime,
		isLeave,
		isHoliday = false,
		isInvalid = false
	} = params;
	
	console.debug("Updating attendance with params:", params);
	
	if (!employeeId || !attendanceId) {
		return parseServerResponse<null>({
			status: "ERROR",
			message: "Employee ID and Attendance ID are required"
		});
	}
	
	
	const hours = clockInTime?.getHours().toString().padStart(2, '0');
  const minutes = clockInTime?.getMinutes().toString().padStart(2, '0');
  const seconds = clockInTime?.getSeconds().toString().padStart(2, '0');
  const clockInTimeString =  `${hours}:${minutes}:${seconds}`;
	
	try {
		const response = await axios.patch(
			`${BACKEND_SERVER_URL}/v1/employee/${employeeId}/attendance/${attendanceId}`,
			{
				isPresent,
				clockInTime: clockInTime ? clockInTimeString: undefined,
				isLeave,
				isHoliday,
				isInvalid
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		const responseBody = response.data;
		console.debug("Response body from updateAttendance:", responseBody);
		
		// Revalidate the attendance page to reflect changes
		revalidatePath(`/dashboard/employee/${employeeId}/attendance`);
		
		return parseServerResponse<any>({
			status: "SUCCESS",
			message: "Attendance Updated Successfully",
			data: responseBody
		});
	} catch (e) {
		console.error("Failed to update attendance with the following error:", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Attendance Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.error("Error details:", {
					errStatus,
					responseStatusCode,
					responseBody: JSON.stringify(responseBody)
				});
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody?.error || "Failed to update attendance",
					data: null,
				});
			}
		}
		
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while updating attendance",
			data: null
		});
	}
}