"use server"

import { BACKEND_SERVER_URL } from "@/env";
import { parseServerResponse } from "@/lib/utils";
import { completeVehicleDetails } from "@/types/vehicle";
import axios, { AxiosError } from "axios";

export async function getAllVehicles() {
	console.debug("Fetching all vehicles");
	
	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/vehicle`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		const vehicles : completeVehicleDetails[] = response.data.vehicles;
		console.debug("Vehicles fetched successfully: ", vehicles);
		
		return parseServerResponse<completeVehicleDetails[]>({
			status: "SUCCESS",
			message: "Vehicles Retrieved Successfully",
			data: vehicles
		});
	} catch (e) {
		console.error("Failed to fetch vehicles with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Get Vehicles Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error,
					data: null
				});
			}
		}
	}
}

export async function getVehicle(vehicleId: string) {
	console.debug("Fetching vehicle details for ID:", vehicleId);
	
	try {
		const response = await axios.get(
			`${BACKEND_SERVER_URL}/v1/vehicle/${vehicleId}`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		const vehicle : completeVehicleDetails = response.data.vehicleData;
		console.debug("Vehicle details fetched successfully: ", vehicle);
		
		return parseServerResponse<completeVehicleDetails>({
			status: "SUCCESS",
			message: "Vehicle Retrieved Successfully",
			data: vehicle
		});
	} catch (e) {
		console.error("Failed to fetch vehicle details with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Get Vehicle Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error || "Failed to fetch vehicle details"
				});
			}
		}
	}
}

export async function updateVehicle(vehicleId: string, data: {vehicleNumber: string}) {
	console.debug("Updating vehicle", { vehicleId, data });
	
	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/vehicle/${vehicleId}`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		const vehicle: completeVehicleDetails = response.data.vehicleData;
		console.debug("Vehicle updated successfully with details: ", vehicle);
		
		return parseServerResponse<completeVehicleDetails>({
			status: "SUCCESS",
			message: "Vehicle Updated Successfully",
			data: vehicle
		});
	} catch (e) {
		console.error("Failed to update vehicle with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Vehicle Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error || "Failed to update vehicle",
					data: null,
				});
			}
		}
	}
}

export async function deleteVehicle(vehicleId: string) {
	console.debug("Deleting vehicle with ID:", vehicleId);
	
	try {
		const response = await axios.delete(
			`${BACKEND_SERVER_URL}/v1/vehicle/${vehicleId}`,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		console.debug("Vehicle deleted successfully");
		
		return parseServerResponse<null>({
			status: "SUCCESS",
			message: response.data.message || "Vehicle Deleted Successfully",
			data: null
		});
	} catch (e) {
		console.error("Failed to delete vehicle with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Delete Vehicle Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error || "Failed to delete vehicle",
					data: null
				});
			}
		}
	}
}

export async function updateVehicleLocation(vehicleId: string, data: {lat: number, long: number}) {
	console.debug("Updating vehicle location", { vehicleId, data });
	
	try {
		const response = await axios.put(
			`${BACKEND_SERVER_URL}/v1/vehicle/${vehicleId}/location`,
			{
				...data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		
		const vehicle: completeVehicleDetails = response.data.vehicleData;
		console.debug("Vehicle location updated successfully with details: ", vehicle);
		
		return parseServerResponse<completeVehicleDetails>({
			status: "SUCCESS",
			message: "Vehicle Location Updated Successfully",
			data: vehicle
		});
	} catch (e) {
		console.error("Failed to update vehicle location with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Update Vehicle Location Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error || "Failed to update vehicle location",
					data: null
				});
			}
		}
		
	}
}

export async function createVehicle(data: {vehicleNumber: string}) {
	console.debug("Creating vehicle", { data });
	
	try {
		const response = await axios.post (
			`${BACKEND_SERVER_URL}/v1/vehicle`,
			{
				... data
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
		const vehicle : completeVehicleDetails = response.data.vehicleData;
		console.debug ("Vehicle created successfully with details: ", vehicle);
		
		return parseServerResponse<completeVehicleDetails> ({
			status: "SUCCESS",
			message: "Vehicle Created Successfully",
			data: vehicle
		});
		
	}
	catch (e) {
		console.error("Failed to create vehicle with the following error: ", e);
		
		if (e instanceof AxiosError) {
			if (e.isAxiosError) {
				console.debug("Create Vehicle Error is Axios Error");
				const errStatus = e.status;
				const responseStatusCode = e.response ? e.response.status : null;
				const responseBody = e.response ? e.response.data : null;
				
				console.debug("Error details : ", { errStatus, responseStatusCode, responseBody });
				
				return parseServerResponse<null>({
					status: "ERROR",
					message: responseBody.error || "Failed to create vehicle",
					data: null
				});
			}
		}
	}
	
	
}