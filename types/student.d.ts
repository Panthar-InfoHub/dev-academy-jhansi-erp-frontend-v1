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
	subjects: subject[],
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
	studentEnrollment: completeStudentEnrollment | undefined
}

export interface createExamEntryReqBody {
	examName: string,
	examType: string,
	examDate: Date,
	note: string | undefined
}

export interface updateExamEntryReqBody {
	examName: string | undefined,
	examType: string | undefined,
	examDate: Date | undefined,
	note: string | undefined
	subjects: examEntrySubject[] | undefined,
	studentPassed: boolean | undefined
}

export interface examEntrySubject extends subject {
	obtainedMarksTheory: number | null,
	totalMarksTheory: number | null,
	obtainedMarksPractical: number | null,
	totalMarksPractical: number | null,
	totalMarks: number | null,
}