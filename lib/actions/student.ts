"use server"

import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse, serverResponseParserArguments } from "@/lib/utils";
import {
	completeStudentDetails, completeStudentEnrollment, createExamEntryReqBody,
	createNewStudentData,
	examEntry, feePayment,
	newEnrollmentReqBody,
	payStudentFeeBody,
	studentAttributes, StudentPaymentsResponse, studentSearchResponse,
	updateEnrollmentBody, updateExamEntryReqBody
} from "@/types/student";
import axios, { AxiosError } from "axios";
import { revalidatePath } from "next/cache";


export async function searchStudents(
	q: string = "",
	page: number = 1,
	limit: number = 10,
	ascending: boolean = false
): Promise<serverResponseParserArguments<studentSearchResponse>> {

	console.log("Searching for students", { q, page, limit, ascending })

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/student/`,
			{
				params: {
					q,
					page,
					limit,
					ascending
				}
			}
		)
		
		
		
		const extractedData = response.data

		return parseServerResponse<studentSearchResponse>({ status: "SUCCESS", data: extractedData, message: "Data Fetched" })
	}
	catch (e) {
		console.error(`Failed to search students with data : ${{ q, limit, page, ascending }}`, JSON.stringify(e))

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Search Student Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error
				})
			}
		}
	}

}


/*
 * Fetches a student by their ID, including nested related data.
 * 
 * The `Student.findByPk` method fetches a student record based on the provided `studentId`.
 *
 * – The `StudentEnrollment` model is included to fetch enrollment details related to the student.
 * – Within `StudentEnrollment`, two nested associations are included:
 *   1.
 * `ExamEntry` – Fetches exam-related details for the student's enrollment.
 *   2.
 * `StudentMonthlyFee` – Fetches fee-related details for the student's enrollment.
 *
 * This nesting structure ensures that both `ExamEntry` and `StudentMonthlyFee` entries 
 * are fetched as part of the `StudentEnrollment` details, providing a complete view 
 * of the student's enrollment and associated data.
 */

//Completed - Added no cache store 
export async function getStudent(studentId: string) {
	console.log(
		"Fetching student with id: ",
		studentId
	)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}`,
			{
				headers: {
					'Cache-Control': 'no-store'
				}
			}
		)
		console.debug("Successfully fetched student with id: ", studentId, "with response: ", response.data)
		return parseServerResponse<completeStudentDetails>({
			status: "SUCCESS",
			message: "Student Fetched Successfully",
			data: response.data.student
		})
	}
	catch (e) {
		console.error(`Failed to get student with id : ${studentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Find Student Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}
}

//COMPLETED
export async function createNewStudent(data: createNewStudentData) {

	console.log("Creating new student with data: ", data)
	try {
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
		console.debug("Successfully created new student with data: ", data, "with response: ", response.data)

		const newStudent: completeStudentDetails = response.data.studentData

		return parseServerResponse<completeStudentDetails>({
			status: "SUCCESS",
			message: "Student Created Successfully",
			data: newStudent
		})

	}
	catch (e) {
		console.error(`Failed to create new student with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Student Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}

}

//Completed
export async function updateStudentDetails(studentId: string, data: Partial<studentAttributes>) {
	console.log("Updating student with id: ", studentId, "with data: ", data)
	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
		console.debug("Successfully updated student with id: ", studentId, "with response: ", response.data)
		return parseServerResponse<completeStudentDetails>({
			status: "SUCCESS",
			message: "Student Updated Successfully",
			data: response.data.studentData
		})

	}
	catch (e) {
		console.error(`Failed to update student with id : ${studentId} with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Student Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}

	}
}

//Completed
export async function deleteStudent(studentId: string, force: boolean = false) {

	console.log("Deleting student with id: ", studentId, "force: ", force)

	try {

		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}`,
			{
				headers: {
					'Content-Type': 'application/json'
				},
				params: {
					force: force
				}
			}
		)

		console.log("Successfully deleted student with id: ", studentId, "with response: ", response.data)
		revalidatePath(`/dashboard/student/data`)
		revalidatePath(`/dashboard/student/${studentId}`)
		return parseServerResponse<null>(
			{
				status: "SUCCESS",
				message: "Student Deleted Successfully",
				data: null
			}
		)

	}
	catch (e) {
		console.error(`Failed to delete student with id : ${studentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Student Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
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
* Student Enrollment
* */

//Completed
export async function createStudentEnrollment(studentId: string, data: newEnrollmentReqBody) {

	console.log("Creating new student enrollment with data: ", data)
	try {
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/new-enrollment`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.debug("Successfully created new student enrollment with data: ", data, "with response: ", response.data)

		const enrollmentData: completeStudentEnrollment = response.data.enrollmentData

		revalidatePath(`/dashboard/student/${studentId}`)
		return parseServerResponse<completeStudentEnrollment>({
			status: "SUCCESS",
			message: "Student Enrollment Created Successfully",
			data: enrollmentData
		})

	}
	catch (e) {
		console.error(`Failed to create new student enrollment with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Student Enrollment Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}

	}

}

//Completed
export async function getEnrollmentDetails(studentId: string, enrollmentId: string) {

	console.log("Fetching student enrollment with id: ", enrollmentId)

	try {

		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}`
		)

		console.debug("Successfully fetched student enrollment with id: ", enrollmentId, "with response: ", response.data)

		const enrollmentData: completeStudentEnrollment = response.data.enrollmentData

		return parseServerResponse<completeStudentEnrollment>({
			status: "SUCCESS",
			message: "Student Enrollment Fetched Successfully",
			data: enrollmentData
		})
	}
	catch (e) {
		console.error(`Failed to get student enrollment with id : ${enrollmentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Find Student Enrollment Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}

}

export async function resetEnrollment(studentId: string, enrollmentId: string) {

	console.log("Resetting student enrollment with id: ", enrollmentId)

	try {

		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/reset`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully reset student enrollment with id: ", enrollmentId, "with response: ", response.data)

		return parseServerResponse<null>({
			status: "SUCCESS",
			message: response.data.message,
			data: null
		})
	}
	catch (e) {

		console.error(`Failed to reset student enrollment with id : ${enrollmentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Reset Student Enrollment Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}

}
//Completed
export async function updateEnrollment(studentId: string, enrollmentId: string, data: updateEnrollmentBody) {

	console.log("Updating student enrollment with id: ", enrollmentId, "with data: ", data)

	try {

		const response = await axios.patch(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/update`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully updated student enrollment with id: ", enrollmentId, "with response: ", response.data)
		revalidatePath(`/dashboard/student/${studentId}/enrollment/${enrollmentId}`)
		return parseServerResponse<completeStudentEnrollment>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.enrollmentData
		})

	}
	catch (e) {

		console.error(`Failed to update student enrollment with id : ${enrollmentId} with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Student Enrollment Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}

}

//Completed – Problem in reloading parent page
export async function deleteEnrollment(studentId: string, enrollmentId: string, force: boolean = false) {

	console.log(`Attempting to delete student enrollment ${enrollmentId} for student ${studentId}`)

	try {

		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}`,
			{
				params: {
					force: force
				},
				headers: {
					'Content-Type': 'application/json'
				}
			},
		)

		
		console.log("Successfully deleted student enrollment with id: ", enrollmentId, "with response: ", response.data)
		revalidatePath(`/dashboard/student/${studentId}`)
		return parseServerResponse<string>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.enrollmentId
		})

	}
	catch (e) {

		console.error(`Failed to delete student enrollment with id : ${enrollmentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Student Enrollment Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}

	}



}

// Completed
export async function payStudentFee(studentId: string, enrollmentId: string, data: payStudentFeeBody) {

	console.log("Paying student fee for enrollment with id: ", enrollmentId, "with data: ", data)

	try {

		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/fee/pay`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully paid student fee for enrollment with id: ", enrollmentId, "with response: ", response.data)
		revalidatePath(`/dashboard/student/${studentId}/enrollment/${enrollmentId}`)
		return parseServerResponse<feePayment>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.paymentReceipt
		})

	}
	catch (e) {
		console.error(`Failed to pay student fee for enrollment with id : ${enrollmentId} with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Pay Student Fee Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
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
* Exam
* */

//Only Implementation Needed
//Completed
export async function createExamEntry(studentId: string, enrollmentId: string, data: createExamEntryReqBody) {

	console.log("Creating new exam entry for student with id: ", studentId, "with data: ", data)

	try {

		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/exam/new`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully created exam entry for student with id: ", studentId, "with response: ", response.data)

		return parseServerResponse<examEntry>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.examEntry
		})


	}

	catch (e) {
		console.error(`Failed to create exam entry for student with id : ${studentId} with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Exam Entry Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}


}
//Completed
export async function updateExamEntry(studentId: string, enrollmentId: string, examEntryId: string, data: updateExamEntryReqBody) {
	console.log("Updating exam entry for student with id: ", studentId, "enrollment id: ", enrollmentId, "with data: ", data)

	try {

		const response = await axios.patch(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/exam/${examEntryId}`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully updated exam entry for student with id: ", studentId, "enrollment id: ", enrollmentId, "with response: ", response.data)

		return parseServerResponse<examEntry>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.examEntry
		})

	}
	catch (e) {
		console.error(`Failed to update exam entry for student with id : ${studentId} with data : ${data}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Exam Entry Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}
}
//Completed
//Only Implementation Needed
export async function deleteExamEntry(studentId: string, enrollmentId: string, examEntryId: string) {

	console.log("Deleting exam entry : ", examEntryId, "in enrollment : ", enrollmentId, "for student : ", studentId)

	try {
		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/exam/${examEntryId}`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log("Successfully deleted exam entry : ", examEntryId, "in enrollment : ", enrollmentId, "for student : ", studentId, "with response: ", response.data)

		return parseServerResponse<number>({
			status: "SUCCESS",
			message: response.data.message,
			data: response.data.destroyedCount
		})

	}
	catch (e) {
		console.error(`Failed to delete exam entry : ${examEntryId} in enrollment : ${enrollmentId} for student : ${studentId}`, JSON.stringify(e))
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Exam Entry Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.error("Error details : ", JSON.stringify({ errStatus, responseStatusCode, responseBody }))
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				})
			}
		}
	}
}

// STUDENT PROFILE IMG
export async function updateStudentProfileImage(studentId: string, file:File) {
	
	console.log("Attempting to update student profile image: ", studentId, file)
	
	try {
		const formData = new FormData()
    
    // Append the file to the FormData with the field name 'profile_img'
    formData.append('profile_img', file)

		
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/image`,
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
		console.error(`Failed to update student profile image: ${studentId}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update student Profile Image Error is Axios Error")
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

export async function getStudentPaymentsInfo(studentId: string, limit: number = 10, page: number = 1) {

	console.log("Fetching student payments info for student: ", studentId)
	
	try {
		const response = await axios.get (
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/payments`,
			{
				params: {
					limit,
					page
				}
			}
		)
		const responseData = response.data as StudentPaymentsResponse
		
		return parseServerResponse<StudentPaymentsResponse>({
			status: "SUCCESS",
			message: responseData.message,
			data: responseData
		})
		
	}
	catch (e) {
		console.error(`Failed to get student payments info for student: ${studentId}`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Get Student Payments Info Error is Axios Error")
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
