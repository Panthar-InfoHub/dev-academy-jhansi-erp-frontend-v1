"use server"
import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";
import { classroom, classSection, completeClassDetails, completeClassSectionDetails, subject } from "@/types/classroom";
import { completeStudentDetails } from "@/types/student";
import axios, { AxiosError } from "axios";
import { revalidatePath } from "next/cache";

interface newClassroomRequest extends Partial<classroom> {
	name: string
	isActive: boolean
}

interface updateClassroomRequest extends Partial<classroom> {
	name: string | undefined,
	isActive: boolean | undefined,
}


interface classroomStudentDataWithFees {
	id: string;
	studentId: string;
	sessionStart: string; // ISO date format as string
	sessionEnd: string;   // ISO date format as string
	monthlyFee: number;
	isActive: boolean;
	student: completeStudentDetails,
	classSection: {
		id: string;
		classRoomId: string;
		name: string;
		isActive: boolean;
		defaultFee: number;
	};
	feeDueTotal: number;
	feeCompletelyPaid: boolean;
	lastPaymentDate: string | null; // ISO date format as string or null
}


interface classroomSectionStudentDataWithFees {
	id: string;
	studentId: string;
	classroomSectionId: string;
	sessionStart: string; // ISO date format as string
	sessionEnd: string;   // ISO date format as string
	monthlyFee: number;
	isActive: boolean;
	student: completeStudentDetails,
	feeDueTotal: number;
	feeCompletelyPaid: boolean;
	lastPaymentDate: string | null; // ISO date format as string or null
}

//Completed
export async function createClassroom(data: newClassroomRequest) {

	console.debug("Creating a new classroom", data)

	try {
		console.debug("Sending axios request to create new classroom")
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/classroom`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		const classroomData: completeClassDetails = response.data.classRoomData
		console.debug("New classroom created successfully with details: ", classroomData)
		console.debug("Response Body from createClassroom: ", response.data)
		revalidatePath("/dashboard/class")
		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Created Successfully",
			data: classroomData
		})
	}
	catch (e) {
		console.error("Failed to create new classroom with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Classroom Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })

				/*
				* This will only give 400 or 500 status codes only
				* */

				console.debug("Bad Request")
				return parseServerResponse({
					status: "ERROR",
					message: responseBody.error
				})


			}
		}

	}


}

export async function updateClassroom(data: Partial<updateClassroomRequest>, classroomId: string,) {
	console.debug("Updating classroom", data)

	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			})

		const classroomData: completeClassDetails = response.data.classRoomData
		console.debug("Classroom updated successfully with details: ", response.data)
		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Updated Successfully",
			data: classroomData
		})

	}
	catch (e) {
		console.error("Failed to update classroom with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Classroom Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })

				return parseServerResponse({
					status: "ERROR",
					message: responseBody.error
				})

			}
		}

	}


}

//Completed
export async function deleteClassroom(classroomId: string) {

	console.debug("Classroom ID to delete: ", classroomId)

	try {
		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`
		)

		console.debug("Successfully deleted classroom with id: ", classroomId, "with response: ", response.data)


		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Deleted Successfully"
		})

	} catch (e) {
		console.error("Failed to delete classroom with the following error: ", e)

		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Classroom Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })

				return parseServerResponse({
					status: "ERROR",
					message: responseBody.error
				})

			}
		}


	}

}

//Completed - Just make page of this
export async function getClassroomDetails(classroomId: string) {

	console.debug("Classroom ID to fetch: ", classroomId)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}`
		)

		console.debug("Successfully fetched classroom with id: ", classroomId, "with response: ", response.data)

		const classroomDetails: completeClassDetails = response.data.classRoomData

		return classroomDetails

	}
	catch (e) {
		console.error("Failed to fetch classroom with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch Classroom Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })


			}
		}
	}
}

// Completed and Updated
export async function getAllClassrooms(): Promise<completeClassDetails[]> {
	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/classroom`
		)

		console.debug("Successfully fetched all classrooms with response: ", response.data)

		const allClassrooms: completeClassDetails[] = response.data.classRoomData

		return allClassrooms
	}
	catch (e) {
		console.error("Failed to fetch all classrooms with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch All Classrooms Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })



			}
		}
	}
}

export async function getClassroomStudentsInfo(classroomId: string, data: {
	startPeriod: Date,
	endPeriod: Date,
	activeOnly: boolean,
}) {

	console.debug("Classroom ID to fetch students info: ", classroomId)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/students`,
			{
				params: {
					...data
				}
			}
		)

		console.debug("Successfully fetched classroom students info with id: ", classroomId, "with response: ", response.data)

		const students: classroomStudentDataWithFees[] = response.data.students

		return parseServerResponse<classroomStudentDataWithFees[]>({
			status: "SUCCESS",
			data: students,
		})
	}
	catch (e) {
		console.error("Failed to fetch classroom students info with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch Classroom Students Info Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
			}
		}
	}

}

/*
*
* Classroom section operations are below!
*
* */

interface newClassSectionRequest extends Partial<classSection> {
	name: string
	isActive: boolean,
	defaultFee: number, // Must be greater than 0
	subjects: subject[],
}

interface updateClassSectionRequest extends Partial<classSection> {
	name?: string
	isActive?: boolean
	defaultFee?: number
	subjects?: subject[]
}

//Completed in Section Page
export async function getAllSectionsOfClassroom(classroomId: string) {

	console.debug("Classroom ID to fetch sections: ", classroomId)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section`
		)

		console.debug("Successfully fetched classroom sections with id: ", classroomId, "with response: ", response.data)

		const classSections: completeClassSectionDetails[] = response.data.sections

		return classSections


	}
	catch (e) {
		console.error("Failed to fetch classroom sections with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch Classroom Sections Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
			}
		}
	}

}

//Completed
export async function createClassroomSection(classroomId: string, data: newClassSectionRequest) {

	console.debug("Creating new section in classroom : ", classroomId, "with data: ", data)


	try {
		const response = await axios.post(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			})

		console.debug("Successfully created new section in classroom : ", classroomId, "with response: ", response.data)

		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Section Created Successfully",
			data: response.data.classSectionData
		}
		)

	}
	catch (e) {
		console.error("Failed to create new section in classroom with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Classroom Section Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
			}
		}

	}


}


// Completed
export async function updateClassroomSection(classroomId: string, classroomSectionId: string, data: updateClassSectionRequest) {

	console.debug("Updating classroom section : ", classroomSectionId, "inside class", classroomId, "with data: ", data)

	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}`,
			{ ...data }
		)

		console.debug("Successfully fetched classroom sections with id: ", classroomId, "with response: ", response.data)
		revalidatePath("/dashboard/class/section")
		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Section Updated Successfully",
			data: response.data.classSectionData
		})

	} catch (e) {
		console.error("Failed to update classroom section with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Classroom Section Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody: JSON.stringify(responseBody) })
			}
		}

	}

}

//Completed
export async function deleteClassroomSection(classroomId: string, classroomSectionId: string) {

	console.debug("Deleting classroom section : ", classroomSectionId, "inside class", classroomId)

	try {
		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}`
		)

		console.debug("Successfully deleted classroom section with id: ", classroomSectionId, "with response: ", response.data)
		revalidatePath("/dashboard/class/section")
		return parseServerResponse({
			status: "SUCCESS",
			message: "Classroom Section Deleted Successfully"
		})
	}
	catch (e) {
		console.error("Failed to delete classroom section with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Classroom Section Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
			}
		}
	}
}

export async function getClassroomSectionStudentsInfo(classroomId: string, classroomSectionId: string,
	data:
		{
			startPeriod: Date,
			endPeriod: Date,
			activeOnly: boolean,
		}) {

	console.debug("Classroom ID to fetch students info: ", classroomId, "Classroom Section ID to fetch students info: ", classroomSectionId)

	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/classroom/${classroomId}/class-section/${classroomSectionId}/students`,
			{
				params: {
					...data
				}
			}
		)

		console.debug("Successfully fetched classroom students info with id: ", classroomId, "with response: ", response.data)

		const students: classroomSectionStudentDataWithFees[] = response.data.students

		return parseServerResponse<classroomSectionStudentDataWithFees[]>({ status: "SUCCESS", data: students, message: "Fetched Student Data" })
	}
	catch (e) {
		console.error("Failed to fetch classroom students info with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch Classroom Students Info Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: "Failed to fetch students info",
					data: null
				})
			}
			
		}
	}

}