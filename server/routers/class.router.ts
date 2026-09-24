import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { classContract } from "../contracts/class.contract"
import { classes, results } from "../db/schema"
import { fetchSingleClass, listAllClasses } from "../queries/class.query"
import { listStudentsByClass } from "../queries/student.query"
import { requireAdmin, requireClassAccess, requireSession } from "../utils/auth-guard"

const os = implement(classContract).$context<APiContext>()

const listClasses = os.list.handler(async ({ context }) => {
  requireSession(context)
  return await listAllClasses()
})

const getSingleClass = os.getOne.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const classRecord = await fetchSingleClass(input.id)
  if (!classRecord) throw errors.NOT_FOUND()

  const studentCount = (await listStudentsByClass(classRecord.id)).length
  const count = { students: studentCount.toString() }

  return { ...classRecord, count }
})

const createClass = os.create.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  // Check for name conflict
  const existingClass = await fetchSingleClass(input.name, "name")
  if (existingClass) throw errors.CONFLICT()

  const [newClass] = await db.insert(classes).values(input).returning()
  const returnClass = await fetchSingleClass(newClass!.id, "id")
  return returnClass!
})

const updateClass = os.update.handler(async ({ input, errors, context }) => {
  requireClassAccess(context, input.id)

  const existingClass = await fetchSingleClass(input.id)
  if (!existingClass) throw errors.NOT_FOUND()

  const user = requireSession(context)

  // Only admins may reassign the class teacher
  if (
    user.role !== "admin" &&
    input.teacherId !== undefined &&
    input.teacherId !== existingClass.teacherId
  ) {
    throw errors.FORBIDDEN({ message: "Only admins can reassign a class teacher" })
  }

  // Only admins may rename a class (a school-wide change)
  if (user.role !== "admin" && input.name !== existingClass.name) {
    throw errors.FORBIDDEN({ message: "Only admins can rename a class" })
  }

  // Check name conflict if name changed
  if (input.name !== existingClass.name) {
    const nameConflict = await fetchSingleClass(input.name, "name")
    if (nameConflict) throw errors.CONFLICT()
  }

  const [updatedClass] = await db
    .update(classes)
    .set({ name: input.name, teacherId: input.teacherId })
    .where(eq(classes.id, input.id))
    .returning()

  const returnClass = await fetchSingleClass(updatedClass!.id)
  return returnClass!
})

const removeClass = os.delete.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const existingClass = await fetchSingleClass(input.id)
  if (!existingClass) throw errors.NOT_FOUND()

  const classStudents = await listStudentsByClass(existingClass.id)

  if (classStudents.length > 0) {
    throw errors.PRECONDITION_FAILED({
      message:
        "Cannot delete class because it contains student(s). Please re-assign students to a new class"
    })
  }

  // results.class_id is onDelete: restrict — reject before the raw FK error.
  const existingResult = await db.query.results.findFirst({
    where: eq(results.classId, input.id),
    columns: { id: true }
  })
  if (existingResult) {
    throw errors.PRECONDITION_FAILED({
      message: "Cannot delete a class that has results. Delete the results first."
    })
  }

  await db.delete(classes).where(eq(classes.id, input.id))
  return { success: true }
})

const setSubjectList = os.setSubjectList.handler(async ({ input, errors, context }) => {
  requireClassAccess(context, input.id)

  const existingClass = await fetchSingleClass(input.id!)
  if (!existingClass) throw errors.NOT_FOUND()

  const [updatedClass] = await db
    .update(classes)
    .set({ subjectListId: input.subjectListId })
    .where(eq(classes.id, input.id!))
    .returning()

  const returnClass = await fetchSingleClass(updatedClass!.id)
  return returnClass!
})

export const classRouter = {
  list: listClasses,
  getOne: getSingleClass,
  create: createClass,
  update: updateClass,
  delete: removeClass,
  setSubjectList: setSubjectList
}
