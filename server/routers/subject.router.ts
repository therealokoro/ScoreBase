import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { subjectContract } from "../contracts/subject.contract"
import { subjects } from "../db/schema"
import { getSchoolSettings } from "../kv/school-settings"
import { fetchSingleSubject, listAllSubjects } from "../queries/subject.query"

const os = implement(subjectContract)

const listSubjects = os.list.handler(async () => await listAllSubjects())

const getSingleSubject = os.getOne.handler(async ({ input, errors }) => {
  const subject = await fetchSingleSubject(input.id)
  if (!subject) throw errors.NOT_FOUND()
  return subject
})

const createSubject = os.create.handler(async ({ input, errors }) => {
  // Check for name conflict
  const existingSubject = await fetchSingleSubject(input.name, "name")
  if (existingSubject) throw errors.CONFLICT()

  const [newSubject] = await db
    .insert(subjects)
    .values({
      name: input.name,
      tags: input.tags ? input.tags : []
    })
    .returning()
  return newSubject!
})

const updateSubject = os.update.handler(async ({ input, errors }) => {
  const existingSubject = await fetchSingleSubject(input.id)
  if (!existingSubject) throw errors.NOT_FOUND()

  // Check name conflict if name changed
  if (input.name !== existingSubject.name) {
    const nameConflict = await fetchSingleSubject(input.name!, "name")
    if (nameConflict) throw errors.CONFLICT()
  }

  const [updatedSubject] = await db
    .update(subjects)
    .set({
      name: input.name,
      tags: input.tags !== undefined ? input.tags : []
    })
    .where(eq(subjects.id, input.id))
    .returning()

  return updatedSubject!
})

const removeSubject = os.delete.handler(async ({ input, errors }) => {
  const existingSubject = await fetchSingleSubject(input.id)
  if (!existingSubject) throw errors.NOT_FOUND()

  // TODO: Check for associated results/class presets
  // if (hasResultsOrPresets) throw errors.PRECONDITION_FAILED()

  await db.delete(subjects).where(eq(subjects.id, input.id))
  return { success: true }
})

const getSubjectTags = os.getTags.handler(async () => {
  const subjectTags = await getSchoolSettings("subjectTags")
  return subjectTags
})

export const subjectRouter = {
  list: listSubjects,
  getOne: getSingleSubject,
  create: createSubject,
  update: updateSubject,
  delete: removeSubject,
  getTags: getSubjectTags
}
