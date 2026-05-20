import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { classContract } from "../contracts/class.contract"
import { classes } from "../db/schema"
import { fetchSingleClass, listAllClasses } from "../queries/class.query"

const os = implement(classContract)

const listClasses = os.list.handler(async () => await listAllClasses())

const getSingleClass = os.getOne.handler(async ({ input, errors }) => {
  const classRecord = await fetchSingleClass(input.id)
  if (!classRecord) throw errors.NOT_FOUND()
  return classRecord
})

const createClass = os.create.handler(async ({ input, errors }) => {
  // Check for name conflict
  const existingClass = await fetchSingleClass(input.name, "name")
  if (existingClass) throw errors.CONFLICT()

  const [newClass] = await db.insert(classes).values(input).returning()
  const returnClass = await fetchSingleClass(newClass!.id, "id")
  return returnClass!
})

const updateClass = os.update.handler(async ({ input, errors }) => {
  const existingClass = await fetchSingleClass(input.id!)
  if (!existingClass) throw errors.NOT_FOUND()

  // Check name conflict if name changed
  if (input.name !== existingClass.name) {
    const nameConflict = await fetchSingleClass(input.name, "name")
    if (nameConflict) throw errors.CONFLICT()
  }

  // TODO: apply subject list if available

  const [updatedClass] = await db
    .update(classes)
    .set({ name: input.name })
    .where(eq(classes.id, input.id!))
    .returning()

  const returnClass = await fetchSingleClass(updatedClass!.id)
  return returnClass!
})

const removeClass = os.delete.handler(async ({ input, errors }) => {
  const existingClass = await fetchSingleClass(input.id)
  if (!existingClass) throw errors.NOT_FOUND()

  // TODO: Check for associated students/results
  // if (hasStudentsOrResults) throw errors.PRECONDITION_FAILED()

  await db.delete(classes).where(eq(classes.id, input.id))
  return { success: true }
})

export const classRouter = {
  list: listClasses,
  getOne: getSingleClass,
  create: createClass,
  update: updateClass,
  delete: removeClass
}
