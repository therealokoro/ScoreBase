// import { createSelectSchema } from "drizzle-zod";
import z from "zod"

import { ClassSchema } from "./academic"
// import { user } from "~~/server/db/schema";

/* Teacher Schemas */
// const UserSchema = createSelectSchema(user);

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
  // updatedAt: z.date(),
  role: z.string(),
  phoneNumber: z.string(),
  class: ClassSchema.pick({ id: true, name: true }).optional()
})

export const CreateTeacherSchema = TeacherSchema.pick({
  name: true,
  email: true,
  phoneNumber: true
})

export const UpdateTeacherSchema = TeacherSchema.omit({ role: true, createdAt: true })
