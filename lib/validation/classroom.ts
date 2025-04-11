import { z } from "zod"

// Schema for creating a new classroom
export const createClassroomSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  isActive: z.boolean().default(true),
})

// Schema for updating a classroom
export const updateClassroomSchema = z
  .object({
    name: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name or isActive) must be provided",
  })

// Schema for creating a new section
export const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  isActive: z.boolean().default(true),
  defaultFee: z.number().min(0).max(10000000, "Default fee must be between 0 and 10,000,000"),
  subjects: z
    .array(
      z.object({
        name: z.string().min(1, "Subject name is required"),
        code: z.string().min(1, "Subject code is required"),
        theoryExam: z.boolean().default(false),
        practicalExam: z.boolean().default(false),
      }),
    )
    .min(1, "At least one subject is required"),
})

// Schema for updating a section
export const updateSectionSchema = z
  .object({
    name: z.string().optional(),
    defaultFee: z.number().min(0).max(10000000, "Default fee must be between 0 and 10,000,000").optional(),
    isActive: z.boolean().optional(),
    subjects: z
      .array(
        z.object({
          name: z.string().min(1, "Subject name is required"),
          code: z.string().min(1, "Subject code is required"),
          theoryExam: z.boolean().default(false),
          practicalExam: z.boolean().default(false),
        }),
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
