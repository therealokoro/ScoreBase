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
  return await db.query.subjects.findMany()
}

/** List subjects by tags (contains any of the provided tags) */
export const listSubjectsByTags = async (tags: string[]) => {
  return await db.query.subjects.findMany({
    where: (subjects, { sql }) => sql`${subjects.tags} LIKE '%' || ${tags[0]} || '%'`
  })
}
