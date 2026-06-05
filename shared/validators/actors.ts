import z from "zod"

import { ClassSchema } from "./academic"

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string("Please provide a name"),
  email: z.email("Please provide a valid email address"),
  createdAt: z.date(),
  role: z.string(),
  phoneNumber: z
    .string("Please provide a valid phone number")
    .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
  class: ClassSchema.pick({ id: true, name: true }).nullable()
})

export const UpsertTeacherSchema = TeacherSchema.pick({
  name: true,
  email: true,
  phoneNumber: true
}).extend({ classId: z.string().optional() })

export const UpdateTeacherSchema = UpsertTeacherSchema.extend({ id: z.string() })

export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>
export type UpsertTeacherInput = z.infer<typeof UpsertTeacherSchema>

export const UpdateAccountInfoSchema = TeacherSchema.pick({
  id: true,
  name: true,
  email: true,
  phoneNumber: true
})

export type UpdateAccountInfoInput = z.infer<typeof UpdateAccountInfoSchema>

export const UpdateAccountPasswordSchema = z
  .object({
    id: z.string(),
    currentPassword: z.string("Please enter your current password"),
    newPassword: z.string("Please enter your new password"),
    confirmPassword: z.string("Please confirm your new password")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })

export type UpdateAccountPasswordInput = z.infer<typeof UpdateAccountPasswordSchema>
