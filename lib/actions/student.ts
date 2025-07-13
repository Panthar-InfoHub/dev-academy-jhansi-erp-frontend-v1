"use server";

import {BACKEND_SERVER_URL} from "@/env";
import {parseServerResponse, serverResponseParserArguments} from "@/lib/utils";

import {
	completeStudentDetails,
	completeStudentEnrollment,
	createExamEntryReqBody,
	createNewStudentData,
	examEntry,
	feePayment,
	newEnrollmentReqBody,
	payStudentFeeBody,
	studentAttributes,
	StudentPaymentsResponse,
	studentSearchResponse,
	updateEnrollmentBody,
	updateExamEntryReqBody
} from "@/types/student";
import axios, {AxiosError} from "axios";
import {revalidatePath} from "next/cache";
import {getCache, invalidateCache, setCache} from "@/lib/cache";

// ----------------------------------------------------------------------
// GET REQUESTS WITH CACHING
// ----------------------------------------------------------------------

export async function searchStudents(
	q: string = "",
	page: number = 1,
	limit: number = 10,
	ascending: boolean = false
): Promise<serverResponseParserArguments<studentSearchResponse>> {
	console.log("Searching for students", { q, page, limit, ascending });
	
	// Create a unique cache key based on the search parameters.
	const cacheKey = `student-search-${q}-${page}-${limit}-${ascending}`;
	const cachedData = getCache<serverResponseParserArguments<studentSearchResponse>>(cacheKey);
	if (cachedData) {
		console.debug("Returning cached student search data for key:", cacheKey);
		return cachedData;
	}

	try {
		// Build URL with query parameters.
		const url = new URL(`${BACKEND_SERVER_URL}/v1/student/`);
		url.searchParams.append("q", q);
		url.searchParams.append("page", String(page));
		url.searchParams.append("limit", String(limit));
		url.searchParams.append("ascending", String(ascending));
		
		const response = await fetch(url.toString());
		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			console.error("Fetch error in searchStudents:", { status: response.status, body: errorBody });
			return parseServerResponse<null>({
				status: "ERROR",
				message: errorBody.error || "Failed to fetch student search results",
				data: null
			});
		}
		
		const extractedData = await response.json();
		
		const parsedResponse = parseServerResponse<studentSearchResponse>({
			status: "SUCCESS",
			data: extractedData,
			message: "Data Fetched"
		});
		
		// Cache the search response for 30 seconds.
		setCache(cacheKey, parsedResponse, 30);
		return parsedResponse;
	} catch (e: any) {
		console.error("Failed to search students with data:", { q, limit, page, ascending }, e);
		if (e instanceof AxiosError && e.isAxiosError) {
			const responseBody = e.response ? e.response.data : null;
			console.debug("Search Student Error is Axios Error");
			return parseServerResponse<null>({
				status: "ERROR",
				message: responseBody?.error || "An error occurred while searching students",
				data: null
			});
		}
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while searching students",
			data: null
		});
	}
}

export async function getStudent(studentId: string) {
	console.log("Fetching student with id:", studentId);
	
	if (!studentId) {
		return parseServerResponse<null>({
			status: "ERROR",
			message: "Student ID is required",
			data: null
		});
	}
	
	// Create a unique cache key for the student.
	const cacheKey = `student-details-${studentId}`;
	const cachedData = getCache<serverResponseParserArguments<completeStudentDetails>>(cacheKey);
	if (cachedData) {
		console.debug("Returning cached student data for key:", cacheKey);
		return cachedData;
	}
	
	try {
		const url = `${BACKEND_SERVER_URL}/v1/student/${studentId}`;
		
		const response = await fetch(url, {
			// We avoid using any caching headers so that our manual caching can take place.
			headers: {
				"Content-Type": "application/json"
			}
		});
		
		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			console.error("Fetch error in getStudent:", { status: response.status, body: errorBody });
			return parseServerResponse<null>({
				status: "ERROR",
				message: errorBody.error || "Failed to fetch student data",
				data: null
			});
		}
		
		const data = await response.json();
		
		const parsedResponse = parseServerResponse<completeStudentDetails>({
			status: "SUCCESS",
			message: "Student Fetched Successfully",
			data: data.student
		});
		
		// Cache the student data for 30 seconds.
		setCache(cacheKey, parsedResponse, 30);
		return parsedResponse;
	} catch (e: any) {
		console.error(`Failed to get student with id: ${studentId}`, e);
		if (e instanceof AxiosError && e.isAxiosError) {
			const responseBody = e.response ? e.response.data : null;
			console.debug("Get Student Error is Axios Error");
			return parseServerResponse<null>({
				status: "ERROR",
				message: responseBody?.error || "Failed to fetch student data",
				data: null
			});
		}
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while fetching student data",
			data: null
		});
	}
}

// ----------------------------------------------------------------------
// NON-GET REQUESTS (e.g., creating or updating students)
// ----------------------------------------------------------------------

export async function createNewStudent(data: createNewStudentData) {
	console.log("Creating new student with data:", data);
	try {
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/student`,
			{ ...data },
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		);
		
		// After creating a new student, you might want to revalidate related cache or paths.
		revalidatePath("/dashboard/student");
		return parseServerResponse<completeStudentDetails>({
			status: "SUCCESS",
			message: "Student Created Successfully",
			data: response.data.studentData
		});
	} catch (e: any) {
		console.error("Failed to create new student", e);
		if (e instanceof AxiosError && e.isAxiosError) {
			const responseBody = e.response ? e.response.data : null;
			return parseServerResponse<null>({
				status: "ERROR",
				message: responseBody?.error || "Failed to create new student",
				data: null
			});
		}
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while creating a new student",
			data: null
		});
	}
}

export async function updateStudentDetails(studentId: string, updatedData: Partial<studentAttributes>) {
	if (!studentId) {
		return parseServerResponse({ status: "ERROR", message: "Student ID is required" });
	}
	
	console.log("Updating student with id:", studentId, "data:", updatedData);
	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}`,
			updatedData,
			{
				headers: {
					"Content-Type": "application/json"
				}
			}
		);
		
		// Invalidate the cached student details.
		invalidateCache(`student-details-${studentId}`);
		revalidatePath(`/dashboard/student/${studentId}`);
		
		return parseServerResponse({
			status: "SUCCESS",
			message: "Student Updated Successfully",
			data: response.data.student
		});
	} catch (e: any) {
		console.error("Failed to update student", e);
		if (e instanceof AxiosError && e.isAxiosError) {
			const responseBody = e.response ? e.response.data : null;
			return parseServerResponse<null>({
				status: "ERROR",
				message: responseBody?.error || "Failed to update student",
				data: null
			});
		}
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while updating the student",
			data: null
		});
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
		revalidatePath(`/dashboard/student/${studentId}`)
		invalidateCache(`student-details-${studentId}`)
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
	
	// Create a unique cache key for this enrollment

	// Check if we have this data in the cache

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}`
		)
		
		console.debug("Successfully fetched student enrollment with id: ", enrollmentId, "with response: ", JSON.stringify(response.data))
		
		const enrollmentData: completeStudentEnrollment = response.data.enrollmentData

		// Cache the enrollment data for 5 minutes (300 seconds)
		// You can adjust the TTL based on how frequently this data changes


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
					message: responseBody?.error || "Failed to fetch enrollment details",
					data: null
				})
			}
		}
		
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while fetching enrollment details",
			data: null
		})
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`)
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
	
	const cacheKey = `student-payments-info-${studentId}`
	const cachedData = getCache(cacheKey)
	if (cachedData) {
		console.debug("Returning cached student payments info for key:", cacheKey)
		return cachedData as serverResponseParserArguments<StudentPaymentsResponse>
	}
	
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
		setCache(cacheKey, responseData, 10) // 10 seconds
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


export async function resetEnrollment(
	studentId: string,
	enrollmentId: string,
	newFeeAmount?: number,
): Promise<serverResponseParserArguments<null>> {
	try {
		const url = `${BACKEND_SERVER_URL}/v1/student/${studentId}/enrollment/${enrollmentId}/reset`;
		const response = await fetch(url, {
			method: "PUT", // assuming reset is done via POST method
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({newFeeAmount}),
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			console.error("Error resetting enrollment:", {
				status: response.status,
				body: errorBody,
			});
			return parseServerResponse<null>({
				status: "ERROR",
				message: errorBody.error || "Failed to reset enrollment",
				data: null,
			});
		}

		// Clear the cache for enrollment details.
		// Here we assume the enrollment details have been cached using a key of the format:
		// `student-enrollment-${studentId}-${enrollmentId}`
		invalidateCache(`student-enrollment-${studentId}-${enrollmentId}`);
		revalidatePath(`/dashboard/student/${studentId}/enrollment/${enrollmentId}`);
		
		return parseServerResponse<null>({
			status: "SUCCESS",
			message: "Enrollment has been reset successfully",
			data: null,
		});
	} catch (error: any) {
		console.error("Unexpected error resetting enrollment:", error);
		return parseServerResponse<null>({
			status: "ERROR",
			message: "An unexpected error occurred while resetting enrollment",
			data: null,
		});
	}
}
