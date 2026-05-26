/* This file contains reusable queries for academic session operations */
import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

import { academicSessions } from "../db/schema"

/** Find an academic session by its id or name */
export const fetchSingleAcademicSession = async (payload: string, column: "id" | "name" = "id") => {
  return await db.query.academicSessions.findFirst({
    where: eq(academicSessions[column], payload),
    with: {
      terms: {
        orderBy(fields, operators) {
          return operators.asc(fields.position)
        }
      }
    }
  })
}

/** List all academic sessions */
export const listAllAcademicSessions = async () => {
  return await db.query.academicSessions.findMany()
}
