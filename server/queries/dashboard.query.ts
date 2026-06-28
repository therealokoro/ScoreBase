/* This file contains reusable queries for the admin dashboard summary */
import { db } from "@nuxthub/db"
import { and, count, eq, not } from "drizzle-orm"

import { classes, results, students, user } from "../db/schema"
import { getSchoolSettings } from "../kv/school-settings"
import { fetchSingleAcademicSession } from "./session.query"

/**
 * Counts students, classes, and teachers in three parallel queries. Cheap aggregate counts — no
 * need to pull full rows for a dashboard stat.
 */
export const fetchDashboardCounts = async () => {
  const [studentCount, classCount, teacherCount] = await Promise.all([
    db.select({ value: count() }).from(students),
    db.select({ value: count() }).from(classes),
    db
      .select({ value: count() })
      .from(user)
      .where(not(eq(user.role, "admin")))
  ])

  return {
    students: studentCount[0]?.value ?? 0,
    classes: classCount[0]?.value ?? 0,
    teachers: teacherCount[0]?.value ?? 0
  }
}

/**
 * Resolves the active session + active term names from the IDs stored in school settings. Returns
 * null for either field if no active session/term has been configured yet, or if the stored ID no
 * longer points to a real row (e.g. the session was deleted after being set active).
 */
export const fetchActiveSessionAndTerm = async () => {
  const [activeSessionId, activeTermId] = await Promise.all([
    getSchoolSettings("activeSession"),
    getSchoolSettings("activeTerm")
  ])

  if (!activeSessionId) {
    return { activeSession: null, activeTerm: null }
  }

  const session = await fetchSingleAcademicSession(activeSessionId)
  if (!session) {
    return { activeSession: null, activeTerm: null }
  }

  const term = activeTermId ? (session.terms.find((t) => t.id === activeTermId) ?? null) : null

  return {
    // split the session name by the empty space and pick only the year without the suffix
    activeSession: { id: session.id, name: session.name.split(" ")[0]! },
    activeTerm: term ? { id: term.id, name: term.name } : null
  }
}

/**
 * Counts results by status, scoped to a single term. Always returns all four statuses (defaulting
 * to 0) so the UI never has to guard against a missing key.
 */
export const fetchResultStatusCountsByTerm = async (termId: string) => {
  const rows = await db
    .select({ status: results.status, value: count() })
    .from(results)
    .where(eq(results.termId, termId))
    .groupBy(results.status)

  const counts = { draft: 0, submitted: 0, reviewed: 0, published: 0 }
  for (const row of rows) {
    counts[row.status] = row.value
  }
  return counts
}

/** Finds the single class a teacher owns (classes.teacherId is unique). */
export const fetchClassByTeacherId = async (teacherId: string) => {
  return await db.query.classes.findFirst({
    where: eq(classes.teacherId, teacherId),
    with: { students: { columns: { id: true } } }
  })
}

/** Finds the result row for a given (termId, classId) pair, if one exists yet. */
export const fetchResultByTermAndClass = async (termId: string, classId: string) => {
  return await db.query.results.findFirst({
    where: and(eq(results.termId, termId), eq(results.classId, classId))
  })
}
