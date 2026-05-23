// import { createSelectSchema } from "drizzle-zod";
import z from "zod"
// import { user } from "~~/server/db/schema";

/* Teacher Schemas */
// const UserSchema = createSelectSchema(user);

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.string(),
  phoneNumber: z.string()
  // class: z.object({ id: z.string(), name: z.string() }).optional(),
})

export const CreateTeacherSchema = TeacherSchema.pick({
  name: true,
  email: true,
  phoneNumber: true
})

export const UpdateTeacherSchema = TeacherSchema.omit({
  role: true,
  createdAt: true,
  updatedAt: true
})
