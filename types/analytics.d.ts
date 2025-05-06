

export interface PaymentsInfoResponse {
  count: number
  payments: PaymentInfo[]
}

export interface PaymentInfo {
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