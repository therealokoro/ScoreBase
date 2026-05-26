import z from "zod"

import { ClassSchema } from "./academic"

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
  role: z.string(),
  phoneNumber: z.string().regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
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
