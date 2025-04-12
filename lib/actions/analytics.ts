"use server"

import axios, { AxiosError } from "axios";
import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";
import { PaymentsInfoResponse } from "@/types/analytics";

export async function getPayments(start_date: Date, end_date: Date, page: number = 1, limit: number = 10, ascending: boolean = false) {
  
  console.log("Fetching payments for date range: ", start_date, end_date, "page: ", page, "limit: ", limit, "ascending: ", ascending)
  
  try {
    const response = await axios.get(
      `${BACKEND_SERVER_URL}/v1/analytics/payments-info`,
	    {
				params: {
					start_date,
					end_date,
					page,
					limit,
				}
	    }
    )
    
    const data: PaymentsInfoResponse = response.data
	  console.debug("Response from getPayments: ", JSON.stringify(data))
    
    return parseServerResponse<PaymentsInfoResponse>({
      status: "SUCCESS",
      message: "Successfully fetched payments",
      data: data
    })
    
  } catch (e) {
		console.error(`Failed to find payments`, e)
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Find Payments Error is Axios Error")
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