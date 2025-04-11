export interface vehicle {
	vehicleNumber: string;
	latest_lat: number | null;
	latest_long: number | null;
}

export interface completeVehicleDetails extends vehicle {
	id: string;
	createdAt: string;
	updatedAt: string;
}

export interface updateVehicleLocationRequest {
	lat: number;
	long: number;
}
