import { db } from "@nuxthub/db"
import { ORPCError, implement } from "@orpc/server"
import { eq, or, sql, desc } from "drizzle-orm"

import type { APiContext } from "../context"
import { studentContract } from "../contracts/student.contract"
import { students } from "../db/schema"
import { getSchoolSettings } from "../kv/school-settings"
import { fetchStudentById, listAllStudents, listStudentsPaginated } from "../queries/student.query"
import { requireAdmin, requireClassAccess } from "../utils/auth-guard"

async function checkConflict(name: string, studentId: string, errors: any) {
  // Check for conflicts
  const conflict = await db.query.students.findFirst({
    where: or(eq(students.name, name), eq(students.studentId, studentId))
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

    const latest = await db.query.students.findFirst({
      where: sql`${students.studentId} LIKE ${`${prefix}-${year}-%`}`,
      orderBy: desc(students.studentId)
    })

    const lastSequence = latest ? Number(latest.studentId.split("-").at(-1)) : 0
    const sequence = String(lastSequence + 1).padStart(4, "0")
    studentId = `${prefix}-${year}-${sequence}`
  } else {
    studentId = input.studentId.trim()
  }

  // Check for conflicts
  await checkConflict(input.name, studentId, errors)

  const [newStudent] = await db
    .insert(students)
    .values({ ...input, studentId })
    .returning()
  return newStudent!
})

const updateStudent = os.update.handler(async ({ input, errors, context }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()
  requireClassAccess(context, existingStudent.classId)

  // Only admins may move a student to another class
  const user = context.session!.user
  if (user.role !== "admin" && input.classId !== existingStudent.classId) {
    throw new ORPCError("FORBIDDEN", {
      message: "Only admins can move a student to another class"
    })
  }

  // Check for conflicts
  await checkConflict(input.name, input.studentId!, errors)

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

  // TODO: Check for associated results/scoresheets
  // if (hasResultsOrScoresheets) throw errors.PRECONDITION_FAILED()

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
