

export interface classroom {
	name: string,
	isActive: boolean,
	classSections: []
}

export interface completeClassDetails extends classroom {
	id: string,
}

export interface classSection {
	name: string,
	isActive: boolean,
	defaultFee: number,
	subjects: subject[],
	studentEnrollments: []
}

export interface completeClassSectionDetails extends classSection {
	id: string,
}

export interface subject {
	name: string;
	code: string;
	theoryExam: boolean;
	practicalExam: boolean;
}

export interface completeSubjectDetails extends subject {
	obtainedMarksPractical: number,
	obtainedMarksTheory: number,
	totalMarksTheory: number,
	totalMarksPractical: number,
	totalMarks: number
}