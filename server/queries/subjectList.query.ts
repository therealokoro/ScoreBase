/* This file contains reusable queries for subject-list operations */
import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

import { subjectLists } from "../db/schema"

/** Find a subject-list by id or name */
export const fetchSingleSubjectList = async (payload: string, column: "id" | "name" = "id") => {
  return await db.query.subjectLists.findFirst({
    where: eq(subjectLists[column], payload)
  })
}

/** List all subject-list */
export const listAllSubjectLists = async () => {
  return await db.query.subjectLists.findMany({
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}
