import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq, or, sql, desc } from "drizzle-orm"

import { studentContract } from "../contracts/student.contract"
import { students } from "../db/schema"
import { getSchoolSettings } from "../kv/school-settings"
import { fetchStudentById, listAllStudents, listStudentsPaginated } from "../queries/student.query"

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

const os = implement(studentContract)

const listStudents = os.list.handler(async () => await listAllStudents())

const getSingleStudent = os.getOne.handler(async ({ input, errors }) => {
  const studentRecord = await fetchStudentById(input.id)
  if (!studentRecord) throw errors.NOT_FOUND()
  return studentRecord
})

const createStudent = os.create.handler(async ({ input, errors }) => {
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

const updateStudent = os.update.handler(async ({ input, errors }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()

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

const removeStudent = os.delete.handler(async ({ input, errors }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()

  // TODO: Check for associated results/scoresheets
  // if (hasResultsOrScoresheets) throw errors.PRECONDITION_FAILED()

  await db.delete(students).where(eq(students.id, input.id))
  return { success: true }
})

const queryStudent = os.query.handler(async ({ input }) => {
  const result = await listStudentsPaginated({ ...input })
  return result
})

export const studentRouter = {
  list: listStudents,
  getOne: getSingleStudent,
  create: createStudent,
  update: updateStudent,
  query: queryStudent,
  delete: removeStudent
}
