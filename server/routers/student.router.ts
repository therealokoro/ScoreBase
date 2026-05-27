import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { studentContract } from "../contracts/student.contract"
import { students } from "../db/schema"
import { fetchSingleClass } from "../queries/class.query"
import { fetchStudentById, fetchUniqueStudent, listAllStudents } from "../queries/student.query"

const os = implement(studentContract)

const listStudents = os.list.handler(async () => await listAllStudents())

const getSingleStudent = os.getOne.handler(async ({ input, errors }) => {
  const studentRecord = await fetchStudentById(input.id)
  if (!studentRecord) throw errors.NOT_FOUND()
  return studentRecord
})

const createStudent = os.create.handler(async ({ input, errors }) => {
  // Check if a student exist with any of the inputs
  const existingStudent = await fetchUniqueStudent(input.name, input.studentId, input.phoneNumber)
  if (existingStudent) throw errors.CONFLICT()

  const [newStudent] = await db.insert(students).values(input).returning()
  // fetch the student's class and return it along with student's info
  const studentClass = await fetchSingleClass(input.classId)

  return {
    ...newStudent!,
    class: { id: studentClass?.id, name: studentClass?.name }
  }
})

const updateStudent = os.update.handler(async ({ input, errors }) => {
  const existingStudent = await fetchStudentById(input.id)
  if (!existingStudent) throw errors.NOT_FOUND()

  // Check for student uniqueness
  const studentIdConflict = await fetchUniqueStudent(input.name, input.studentId, input.phoneNumber)
  if (studentIdConflict) throw errors.CONFLICT()

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

export const studentRouter = {
  list: listStudents,
  getOne: getSingleStudent,
  create: createStudent,
  update: updateStudent,
  delete: removeStudent
}
