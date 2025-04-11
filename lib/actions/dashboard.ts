import axios, { AxiosError } from "axios";
import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";


export interface dashboardAnalytics {
	totalActiveEmployees : number,
	totalTeachers : number,
	totalAdmins : number,
	totalRegisteredStudentsInDB : number,
	totalActiveStudents : number,
	enrollmentsCreatedInLastThirtyDays : number,
	activeStudentEnrollments : number,
	totalDuePayment : number,
	totalVehicles : number,
	totalFeePaymentsReceived : number,
}

export async function getDashboardAnalytics() {
 
	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/dash-status`,
			{
				params: {
					current_date: new Date()
				}
			}
		)
  
		const analyticsData: dashboardAnalytics = response.data

		return parseServerResponse<dashboardAnalytics>({
			status: "SUCCESS",
			data: analyticsData,
		})
	}
	catch (e) {
		console.error("Failed to fetch Analytics info info with the following error: ", e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Fetch Analytics Info Info Error is Axios Error")
				const errStatus = e.status
				const responseStatusCode = e.response ? e.response.status : null
				const responseBody = e.response ? e.response.data : null
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody })
			}
		}
	}

}