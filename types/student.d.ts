import {subject, completeClassDetails, completeClassSectionDetails} from "@/types/classroom";
import {identityEntry} from "@/types/employee";

export interface studentAttributes {
	name: string,
	searchName: string
	address: string
	fatherName: string
	fatherPhone: string | undefined,
	motherName: string,
	motherPhone: string | undefined,
	dateOfBirth: Date,
	UDISECode: string,
	classId: string,
	classSectionId: string,
	ids: identityEntry[],
	isActive: boolean,
	studentEnrollments?: completeStudentEnrollment[],
	examEntries?: examEntry[]
}

export interface StudentSearchDetails {
  id: string
  name: string
  searchName: string
  address: string
  dateOfBirth: string
  fatherName: string
  motherName: string
  fatherPhone: string
  motherPhone: string
  isActive: boolean
  ids: identityEntry[]
  createdAt: string
  updatedAt: string
}


export interface studentSearchResponse {
  message: string
	total: number
	page: number
	limit: number
	students: StudentSearchDetails[]
}

export interface completeStudentDetails extends studentAttributes  {
	id: string
}

export interface completeStudentDetailsWithTimestamp extends completeStudentDetails {
	createdAt: string; // ISO string format
	updatedAt: string;
}


export interface createNewStudentData extends Partial<completeStudentDetails> {
	name: string,
	address: string,
	fatherName: string,
	fatherPhone: string | undefined,
	motherName: string,
	motherPhone: string | undefined,
	UDISECode: string
	dateOfBirth: Date,
	ids: identityEntry[],
	isActive: boolean,
}


export interface completeStudentEnrollment {
	id: string,
	studentId: string,
	classroomId:string,
	classroomSectionId: string,
	sessionStart: Date,
	sessionEnd: Date,
	monthlyFee: number,
	isActive: boolean,
	student: completeStudentDetails | undefined,
	subjects: examEntrySubject[],
	isComplete: boolean,
	one_time_fee: number,
	classRoom: completeClassDetails| undefined,
	classSection: completeClassSectionDetails | undefined,
	monthlyFees: monthlyFeeEntry[],
	examDetails: examEntry[],
	feePayments: feePayment[],
	createdAt: Date,
	updatedAt: Date,
}

export interface monthlyFeeEntry {
	id: string,
	enrollmentId: string,
	dueDate: Date,
	feeDue: number,
	amountPaid: number,
	balance: number,
	paidDate: Date | null,
	isActive: boolean,
	studentEnrollment: completeStudentEnrollment | undefined,
	createdAt: Date,
	updatedAt: Date,
}

export interface examEntry {
	examEntryId: string,
	examName: string,
	studentId: string,
	note: string | null,
	enrollmentId: string,
	examType: string,
	subjects: [],
	examDate: Date,
	term: string,
	studentPassed: boolean,
	studentEnrollment: completeStudentEnrollment | undefined,
	student: completeStudentDetails | undefined,
	createdAt: Date,
	updatedAt: Date,
}

export interface newEnrollmentReqBody {
	classRoomSectionId: string,
    sessionStartDate: Date,
    sessionEndDate: Date,
    monthlyFee: number,
    isActive: boolean,
	one_time_fee?: number,
}

export interface updateEnrollmentBody {
	isActive?: boolean;
	isComplete?: boolean;
	one_time_fee?:number;
}

export interface payStudentFeeBody {
	paidAmount: number,
    paidOn: Date | undefined,
}

export interface feePayment {
	id: string,
	enrollmentId: string,
	studentId: string,
	originalBalance: number,
	paidAmount: number,
	paidOn: Date,
	remainingBalance: number,
	createdAt: Date,
	updatedAt: Date,
	student: completeStudentDetails | undefined,
	studentEnrollment: completeStudentEnrollment | undefined,
	monthlyFeeIds: string[],
}

export interface createExamEntryReqBody {
	examName: string,
	examType: string,
	examDate: Date,
	note: string | undefined,
	term: string,
}

export interface updateExamEntryReqBody {
	examName: string | undefined,
	examType: string | undefined,
	examDate: Date | undefined,
	note: string | undefined
	subjects: examEntrySubject[] | undefined,
	studentPassed: boolean | undefined,
	term: string,
}

export interface examEntrySubject extends subject {
	obtainedMarksTheory: number | null,
	totalMarksTheory: number | null,
	obtainedMarksPractical: number | null,
	totalMarksPractical: number | null,
	totalMarks: number | null,
}

export interface StudentPaymentsResponse {
  message: string;
  payments: studentPaymentInfo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}
export interface studentPaymentInfo {
	id: string;
	enrollmentId: string;
	studentId: string;
	originalBalance: number;
	paidAmount: number;
	paidOn: string; // ISO date string
	remainingBalance: number;
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
  }
