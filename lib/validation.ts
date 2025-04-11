import { z } from "zod"

export const signInSchema = z.object({
  username: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Identity document schema
export const identityEntrySchema = z.object({
  idDocName: z.string().min(1, "ID document name is required"),
  idDocValue: z.string().min(1, "ID document value is required"),
})

// Employee creation schema
export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Date of birth must be a valid date",
  }),
  workRole: z.string().min(1, "Work role is required"),
  ids: z.array(identityEntrySchema).default([]),
  salary: z.number().min(0, "Salary must be a positive number").default(0),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"), // Making phone required as requested
  isActive: z.boolean().default(true),
  isFired: z.boolean().default(false),
})

// Employee update schema (partial version of create schema)
export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ password: true })

// Salary update schema
export const updateSalarySchema = z.object({
  salary: z.number().min(0, "Salary must be a positive number"),
})
