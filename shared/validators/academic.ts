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
export const CreateTermSchema = createInsertSchema(terms).pick({ sessionId: true })
export const UpdateTermSchema = createUpdateSchema(terms, {
  id: z.string(),
  name: z.string("The term requires a name")
})

/* Class Schemas */
export const ClassSchema = createSelectSchema(classes).extend({
  teacher: z.object({ id: z.string(), name: z.string() }).nullable()
})
export const UpsertClassSchema = createInsertSchema(classes, {
  name: z.string("The class requires a name")
  // TODO: Add presets on creation
})
export type UpsertClassInput = z.infer<typeof UpsertClassSchema>

/* Subject Schemas */
export const SubjectSchema = createSelectSchema(subjects)
export const UpsertSubjectSchema = createInsertSchema(subjects, {
  name: z.string("The subject requires a name"),
  tags: z
    .array(z.string(), "Please select at least one tag")
    .min(1, "All subjects must have atleast one tag")
})

export const UpdateSubjectSchema = createUpdateSchema(subjects, {
  id: z.string("Please provide the subject id")
})
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>
export type UpsertSubjectInput = z.infer<typeof UpsertSubjectSchema>

/* Subject list Schema */

export const SubjectListSchema = createSelectSchema(subjectLists)

export const UpsertSubjectListSchema = createInsertSchema(subjectLists, {
  name: z.string("Please provide a name for the preset"),
  subjects: z
    .array(z.object({ id: z.string(), name: z.string() }), "Please select a minimum of one subject")
    .min(1, "Please select a minimum of one subject")
})

export const UpdateSubjectListSchema = createUpdateSchema(subjectLists, {
  id: z.string("Please provide the subject presets ID"),
  name: z.string("Please provide a name for the preset")
})

export type UpdateSubjectListInput = z.infer<typeof UpdateSubjectListSchema>
export type UpsertSubjectListInput = z.infer<typeof UpsertSubjectListSchema>
