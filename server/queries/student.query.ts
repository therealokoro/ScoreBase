/* This file contains reusable queries for student operations */
import { db } from "@nuxthub/db"
import { eq, and, or } from "drizzle-orm"

import { students } from "../db/schema"
import { classes } from "../db/schema"

const includeClass = { class: { columns: { id: true, name: true } } } as const

/** Find a student by id */
export const fetchStudentById = async (id: string) => {
  return await db.query.students.findFirst({
    where: eq(students.id, id),
    with: { ...includeClass }
  })
}

/** Find a student by name, studentId, or phoneNumber (for conflict checking) */
export const fetchUniqueStudent = async (
  name: string,
  studentId?: string,
  phoneNumber?: string
) => {
  return await db.query.students.findFirst({
    where: or(
      eq(students.name, name),
      studentId ? eq(students.studentId, studentId) : undefined,
      phoneNumber ? eq(students.phoneNumber, phoneNumber) : undefined
    ),
    with: { ...includeClass }
  })
}

/** List all students and include their class information */
export const listAllStudents = async () => {
  return await db.query.students.findMany({
    with: { ...includeClass }
  })
}

/** List students by class ID */
export const listStudentsByClass = async (classId: string) => {
  return await db.query.students.findMany({
    where: eq(students.classId, classId),
    with: { ...includeClass }
  })
}
