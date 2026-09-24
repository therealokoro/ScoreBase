import { db } from "@nuxthub/db"
import { ORPCError, implement } from "@orpc/server"
import { eq, or, ne, and, sql, like } from "drizzle-orm"

import type { APiContext } from "../context"
import { studentContract } from "../contracts/student.contract"
import { students, scoresheets } from "../db/schema"
import { getSchoolSettings } from "../kv/school-settings"
import { fetchStudentById, listAllStudents, listStudentsPaginated } from "../queries/student.query"
import { requireAdmin, requireClassAccess, requireSession } from "../utils/auth-guard"

async function checkConflict(name: string, studentId: string, errors: any, excludeId?: string) {
  // Check for conflicts, excluding the record being updated (if any)
  const conflict = await db.query.students.findFirst({
    where: and(
      or(eq(students.name, name), eq(students.studentId, studentId)),
      excludeId ? ne(students.id, excludeId) : undefined
    )
  })
  if (conflict) {
    if (conflict.name === name)
      throw errors.CONFLICT({ message: "A student exists with this name" })
    throw errors.CONFLICT({ message: "A student exists with this student ID" })
  }
}

const os = implement(studentContract).$context<APiContext>()

const listStudents = os.list.handler(async ({ context }) => {
  requireAdmin(context)
  return await listAllStudents()
})

const getSingleStudent = os.getOne.handler(async ({ input, errors, context }) => {
  const studentRecord = await fetchStudentById(input.id)
  if (!studentRecord) throw errors.NOT_FOUND()
  requireClassAccess(context, studentRecord.classId)
  return studentRecord
})

const createStudent = os.create.handler(async ({ input, errors, context }) => {
  requireClassAccess(context, input.classId)

  let studentId: string

  if (!input.studentId?.trim()) {
    const prefix = await getSchoolSettings("studentIdPrefix")
    const year = new Date().getFullYear()
    const sequencePrefix = `${prefix}-${year}-`

    // Take the numeric max of the sequence suffix. A lexicographic sort of the
    // student ID would treat "...-0009" as later than "...-0010", so the 10th
    // student of a year would collide with an existing ID.
    const [row] = await db
      .select({
        maxSequence: sql<number | null>`max(cast(substr(${students.studentId}, ${
          sequencePrefix.length + 1
        }) as integer))`
      })
      .from(students)
      .where(like(students.studentId, `${sequencePrefix}%`))

    const lastSequence = row?.maxSequence ?? 0
    const sequence = String(lastSequence + 1).padStart(4, "0")
    studentId = `${sequencePrefix}${sequence}`
  } else {
    studentId = input.studentId.trim()
  }

  // Check for conflicts
  await checkConflict(input.name, studentId, errors)

  try {
    const [newStudent] = await db
      .insert(students)
      .values({ ...input, studentId })
      .returning()
    return newStudent!
  } catch (error: any) {
    // The unique index is the race backstop for concurrent auto-generation.
    if (String(error?.message ?? "").includes("UNIQUE constraint failed: students.student_id")) {
      throw errors.CONFLICT({ message: "A student exists with this student ID" })
    }
    throw error
  }
})

const updateStudent = os.update.handler(async ({ input, errors, context }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()
  requireClassAccess(context, existingStudent.classId)

  // Only admins may move a student to another class
  const user = requireSession(context)
  if (user.role !== "admin" && input.classId !== existingStudent.classId) {
    throw errors.FORBIDDEN({ message: "Only admins can move a student to another class" })
  }

  // Check for conflicts (excluding this student's own row)
  await checkConflict(input.name, input.studentId!, errors, input.id)

  await db
    .update(students)
    .set({
      name: input.name,
      studentId: input.studentId,
      classId: input.classId,
      phoneNumber: input.phoneNumber
    })
    .where(eq(students.id, input.id!))
    .returning()
})

const removeStudent = os.delete.handler(async ({ input, errors, context }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()
  requireClassAccess(context, existingStudent.classId)

  // scoresheets.student_id is onDelete: restrict — reject before the raw FK error.
  const existingScoresheet = await db.query.scoresheets.findFirst({
    where: eq(scoresheets.studentId, input.id),
    columns: { id: true }
  })
  if (existingScoresheet) {
    throw errors.PRECONDITION_FAILED({
      message: "Cannot delete a student with existing results. Remove their scoresheets first."
    })
  }

  await db.delete(students).where(eq(students.id, input.id))
  return { success: true }
})

const queryStudent = os.query.handler(async ({ input, context }) => {
  const user = context.session?.user
  if (!user) throw new ORPCError("UNAUTHORIZED")

  if (user.role !== "admin") {
    if (!user.classId) {
      console.log("i am here.... not admin, no class id")
      return { data: [], total: 0, pageCount: 1 }
    }
    if (input.classId && input.classId !== user.classId) {
      throw new ORPCError("FORBIDDEN", { message: "You do not have access to this class" })
    }
    return listStudentsPaginated({ ...input, classId: user.classId })
  }

  return listStudentsPaginated({ ...input })
})

export const studentRouter = {
  list: listStudents,
  getOne: getSingleStudent,
  create: createStudent,
  update: updateStudent,
  query: queryStudent,
  delete: removeStudent
}
