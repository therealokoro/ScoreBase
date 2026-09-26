/* This file contains reusable queries for subject operations */
import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

import { subjects } from "../db/schema"

/** Find a subject by id or name */
export const fetchSingleSubject = async (payload: string, column: "id" | "name" = "id") => {
  return await db.query.subjects.findFirst({
    where: eq(subjects[column], payload)
  })
}

/** List all subjects */
export const listAllSubjects = async () => {
  return await db.query.subjects.findMany({
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}
