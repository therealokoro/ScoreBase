/* This file contains reusable queries for teacher operations */
import { db } from "@nuxthub/db"
import { eq, not } from "drizzle-orm"

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

/** Fetch a teachers class */
export const fetchTeachersClass = async (teacherId: string, extras = true) => {
  return await db.query.classes.findFirst({
    where(fields, operators) {
      return operators.eq(fields.teacherId, teacherId)
    },
    with: extras
      ? {
          teacher: { columns: { id: true, name: true } },
          subjectList: { columns: { id: true, name: true } }
        }
      : {}
  })
}
