import { z } from "zod";

import type {
  AcademicSessionSchema,
  TermSchema,
  SubjectSchema,
  SubjectListSchema,
  ClassSchema,
} from "../validators/academic";

export type IAcademicSession = z.infer<typeof AcademicSessionSchema>;
export type ITerm = z.infer<typeof TermSchema>;
export type ISubject = z.infer<typeof SubjectSchema>;
export type IClass = z.infer<typeof ClassSchema>;
export type ISubjectList = z.infer<typeof SubjectListSchema>;
