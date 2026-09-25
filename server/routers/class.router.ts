import { db } from "@nuxthub/db"
import { ORPCError, implement } from "@orpc/server"
import { count, eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { classContract } from "../contracts/class.contract"
import { classes, results, students, subjectLists, user } from "../db/schema"
import { fetchSingleClass, listAllClasses } from "../queries/class.query"
import { requireAdmin, requireClassAccess, requireSession } from "../utils/auth-guard"

const os = implement(classContract).$context<APiContext>()

/**
 * Validates that referenced IDs exist before writing, so a bogus teacherId/subjectListId produces a
 * typed error instead of a raw foreign-key failure.
 */
async function assertClassRefsExist(refs: {
  teacherId?: string | null
  subjectListId?: string | null
}): Promise<void> {
  if (refs.teacherId) {
    const teacher = await db.query.user.findFirst({
      where: eq(user.id, refs.teacherId),
      columns: { id: true, role: true }
    })
    if (!teacher || teacher.role !== "teacher") {
      throw new ORPCError("BAD_REQUEST", { message: "The selected teacher was not found" })
    }
  }
  if (refs.subjectListId) {
    const list = await db.query.subjectLists.findFirst({
      where: eq(subjectLists.id, refs.subjectListId),
      columns: { id: true }
    })
    if (!list) {
      throw new ORPCError("BAD_REQUEST", { message: "The selected subject list was not found" })
    }
  }
}

const listClasses = os.list.handler(async ({ context }) => {
  requireSession(context)
  return await listAllClasses()
})

const getSingleClass = os.getOne.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const classRecord = await fetchSingleClass(input.id)
  if (!classRecord) throw errors.NOT_FOUND()

  const [studentCount] = await db
    .select({ value: count() })
    .from(students)
    .where(eq(students.classId, classRecord.id))
  const countSummary = { students: (studentCount?.value ?? 0).toString() }

  return { ...classRecord, count: countSummary }
})

const createClass = os.create.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  await assertClassRefsExist(input)

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

  const sessionUser = requireSession(context)

  // Only admins may reassign the class teacher
  if (
    sessionUser.role !== "admin" &&
    input.teacherId !== undefined &&
    input.teacherId !== existingClass.teacherId
  ) {
    throw errors.FORBIDDEN({ message: "Only admins can reassign a class teacher" })
  }

  // Only admins may rename a class (a school-wide change)
  if (sessionUser.role !== "admin" && input.name !== existingClass.name) {
    throw errors.FORBIDDEN({ message: "Only admins can rename a class" })
  }

  await assertClassRefsExist(input)

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

  const [studentCount] = await db
    .select({ value: count() })
    .from(students)
    .where(eq(students.classId, existingClass.id))

  if ((studentCount?.value ?? 0) > 0) {
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

  await assertClassRefsExist({ subjectListId: input.subjectListId })

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
