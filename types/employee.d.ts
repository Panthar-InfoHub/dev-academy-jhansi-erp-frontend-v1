

export type identityEntry = {
	idDocName: string,
	idDocValue: string
}

export interface EmployeeAttributes {
	name: string,
	password: string,
	address: string | undefined
	fatherName: string | undefined,
	fatherPhone: string | undefined,
	motherName: string | undefined,
	motherPhone: string | undefined,
	dateOfBirth: Date,
	workRole: string,
	salary: number,
	email: string,
	ids: identityEntry[],
	phone: string | undefined,
	isActive: boolean,
	isFired: boolean,
	createdAt: Date,
	updatedAt: Date,
}

export interface completeEmployeeAttributes extends EmployeeAttributes {
	id: string,
}

export interface DailyAttendanceResponse {
  message: string;
  attendanceData: AttendanceDetailEntry[];
}

export interface AttendanceDetailEntry {
    attendanceId: string;
    employeeId: string;
    date: string;
    isPresent: boolean;
    clockInTime: string | null;
    isHoliday: boolean;
    isLeave: boolean;
    isInvalid: boolean | null;
    createdAt: string;
    updatedAt: string;
    employee: {
      name: string;
      dateOfBirth: string;
      phone: string;
      workRole: string;
      isActive: boolean;
      isFired: boolean;
      createdAt: string;
      updatedAt: string;
    };
}


export interface DailyAttendanceResponse {
  message: string;
  attendance: AttendanceDetailEntry[];
}
