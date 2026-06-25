/* This file contains reusable queries for student operations */
import { db } from "@nuxthub/db"
import { and, count, eq, like, sql, SQL } from "drizzle-orm"

import { students } from "../db/schema"

const includeClass = { class: { columns: { id: true, name: true } } } as const

/** Find a student by id */
export const fetchStudentById = async (id: string) => {
  return await db.query.students.findFirst({
    where: eq(students.id, id),
    with: { ...includeClass }
  })
}

/** List all students and include their class information */
export const listAllStudents = async () => {
  return await db.query.students.findMany({
    with: { ...includeClass },
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}

/** List students by class ID */
export const listStudentsByClass = async (classId: string) => {
  return await db.query.students.findMany({
    where: eq(students.classId, classId),
    with: { ...includeClass },
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}

export type StudentListParams = {
  page?: number
  pageSize?: number
  search?: string
  classId?: string
}

export const listStudentsPaginated = async ({
  page = 0,
  pageSize = 10,
  search,
  classId
}: StudentListParams) => {
  const conditions: SQL[] = []

  if (classId) {
    conditions.push(eq(students.classId, classId))
  }

  if (search) {
    conditions.push(like(sql`lower(${students.name})`, `%${search.toLowerCase()}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.students.findMany({
      where,
      with: { ...includeClass },
      limit: pageSize,
      offset: page * pageSize,
      orderBy(fields, opt) {
        return opt.desc(fields.createdAt)
      }
    }),
    db.select({ total: count() }).from(students).where(where)
  ])

  const total = countResult[0]?.total ?? 0

  return {
    data,
    total,
    pageCount: total > 0 ? Math.ceil(total / pageSize) : 1 // minimum of 1 page
  }
}
