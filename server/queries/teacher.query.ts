/* This file contains reusable queries for teacher operations */
import { db } from "@nuxthub/db"
import { and, count, eq, not, sql } from "drizzle-orm"

import { escapeLike } from "#shared/utils/sql"

import { user } from "../db/schema"

const classInclude = { class: { columns: { id: true, name: true } } } as const
const columnPicks = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneNumber: true,
  createdAt: true
} as const

/** Find a teacher by id and include their classes */
export const fetchSingleTeacher = async (id: string) => {
  return await db.query.user.findFirst({
    where: eq(user.id, id),
    columns: { ...columnPicks },
    with: { ...classInclude }
  })
}

/** List all teachers and include their classes */
export const listAllTeachers = async () => {
  return await db.query.user.findMany({
    where: not(eq(user.role, "admin")),
    columns: { ...columnPicks },
    with: { ...classInclude },
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}

export type TeacherListParams = { page?: number; pageSize?: number; search?: string }

/** Paginated teacher list ordered by `createdAt` (indexed), with an optional name search. */
export const listTeachersPaginated = async ({
  page = 0,
  pageSize = 10,
  search
}: TeacherListParams) => {
  const roleFilter = not(eq(user.role, "admin"))
  const where = search
    ? and(
        roleFilter,
        sql`lower(${user.name}) LIKE ${`%${escapeLike(search.toLowerCase())}%`} ESCAPE '\\'`
      )
    : roleFilter

  const [data, countResult] = await Promise.all([
    db.query.user.findMany({
      where,
      columns: { ...columnPicks },
      with: { ...classInclude },
      limit: pageSize,
      offset: page * pageSize,
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt)
      }
    }),
    db.select({ total: count() }).from(user).where(where)
  ])

  const total = countResult[0]?.total ?? 0

  return {
    data,
    total,
    pageCount: total > 0 ? Math.ceil(total / pageSize) : 1
  }
}

/** Fetch a teachers class */
export const fetchTeachersClass = async (teacherId: string) => {
  return await db.query.classes.findFirst({
    where(fields, operators) {
      return operators.eq(fields.teacherId, teacherId)
    },
    with: {
      teacher: { columns: { id: true, name: true } },
      subjectList: { columns: { id: true, name: true } }
    }
  })
}
