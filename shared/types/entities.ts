import { z } from "zod"

import type {
  AcademicSessionSchema,
  TermSchema,
  SubjectSchema,
  SubjectListSchema,
  ClassSchema,
  ClassWithSubjectListSchema
} from "../validators/academic"
import type { TeacherSchema } from "../validators/actors"

export type IAcademicSession = z.infer<typeof AcademicSessionSchema>
export type ITerm = z.infer<typeof TermSchema>
export type ISubject = z.infer<typeof SubjectSchema>
export type IClass = z.infer<typeof ClassSchema>
export type IClassWithSubjectList = z.infer<typeof ClassWithSubjectListSchema>
export type ISubjectList = z.infer<typeof SubjectListSchema>
export type ITeacher = z.infer<typeof TeacherSchema>
