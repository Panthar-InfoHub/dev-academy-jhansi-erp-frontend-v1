

export interface AllAdminDetailsResponse {
  message: string,
  admins: {
    id: string,
    createdAt: string,
    updatedAt: string,
    user: {
      name: string,
      workRole: string,
      isActive: boolean,
      isFired: boolean,
    }
  }
}