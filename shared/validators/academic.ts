import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { academicSessions, terms, classes, subjects, subjectLists } from "~~/server/db/schema"

/* Academic Session Schemas */
export const AcademicSessionSchema = createSelectSchema(academicSessions)
export const UpsertAcademicSessionSchema = createInsertSchema(academicSessions, {
  name: z.string("Please provide a name for the academic session")
})

export type UpsertAcademicSessionInput = z.infer<typeof UpsertAcademicSessionSchema>

export const UpdateAcademicSessionSchema = createUpdateSchema(academicSessions, {
  id: z.string(),
  name: z.string("The academic session requires a name")
})

/* Term Schemas */
export const TermSchema = createSelectSchema(terms)
export const CreateTermSchema = createInsertSchema(terms)
export const UpdateTermSchema = createUpdateSchema(terms, {
  id: z.string(),
  name: z.string("The term requires a name")
})

/* Class Schemas */
export const ClassSchema = createSelectSchema(classes).extend({
  teacher: z.object({ id: z.string(), name: z.string() }).optional()
})
export const CreateClassSchema = createInsertSchema(classes, {
  // TODO: Add presets on creation
})
export const UpdateClassSchema = createUpdateSchema(classes, {
  id: z.string(),
  name: z.string("The class requires a name")
})

/* Subject Schemas */
export const SubjectSchema = createSelectSchema(subjects)
export const CreateSubjectSchema = createInsertSchema(subjects)
export const UpdateSubjectSchema = createUpdateSchema(subjects, {
  id: z.string(),
  name: z.string("The subject requires a name")
})

/* Subject list Schema */

export const SubjectListSchema = createSelectSchema(subjectLists)

export const CreateSubjectListSchema = createInsertSchema(subjectLists, {
  subjectIds: z.array(z.string()).min(1, "A subject list must have atleast one subject")
})

export const UpdateSubjectListSchema = CreateSubjectListSchema.required()
