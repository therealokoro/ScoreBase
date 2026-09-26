import { db } from "@nuxthub/db"
import { and, count, eq, sql, type SQL } from "drizzle-orm"

import { escapeLike } from "#shared/utils/sql"

import { results, scoresheets, subjectScores } from "../db/schema"

// Shared relation presets
// ---------------------------------------------------------------------------

const termWithRelation = {
  term: { columns: { name: true }, with: { session: { columns: { name: true } } } },
  class: { columns: { name: true, id: true } }
} as const

// Result queries
// ---------------------------------------------------------------------------

export type ResultListParams = {
  page?: number
  pageSize?: number
  search?: string
  classId?: string
}

/**
 * Paginated results list. Admins see all results; a `classId` scopes it to one class (teachers).
 * Ordered by `createdAt` (indexed) with an optional case-insensitive name search.
 */
export async function listResultsPaginated({
  page = 0,
  pageSize = 10,
  search,
  classId
}: ResultListParams) {
  const conditions: SQL[] = []
  if (classId) conditions.push(eq(results.classId, classId))
  if (search) {
    conditions.push(sql`lower(${results.name}) LIKE ${`%${escapeLike(search.toLowerCase())}%`} ESCAPE '\\'`)
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.results.findMany({
      where,
      with: { ...termWithRelation },
      limit: pageSize,
      offset: page * pageSize,
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt)
      }
    }),
    db.select({ total: count() }).from(results).where(where)
  ])

  const total = countResult[0]?.total ?? 0

  return {
    data,
    total,
    pageCount: total > 0 ? Math.ceil(total / pageSize) : 1
  }
}

/** Fetches a single result row by its ID */
export async function fetchSingleResult(id: string) {
  return await db.query.results.findFirst({ where: eq(results.id, id) })
}

/**
 * Fetches a result with all its scoresheets and each scoresheet's subject scores fully nested. This
 * is the "full detail" shape used by the score entry page and the report card. Looks the result up
 * by either its own id or by its termId — pass exactly one.
 */
export async function fetchResultWithScoresheets(payload: string, column: "id" | "termId") {
  return await db.query.results.findFirst({
    where: eq(results[column], payload),
    with: {
      scoresheets: {
        with: {
          subjectScores: { with: { subject: { columns: { id: true, name: true } } } },
          student: { columns: { id: true, name: true, studentId: true } }
        }
      }
    }
  })
}

/** Fetches all results belonging to a particular term */
export async function fetchResultsByTerm(termId: string) {
  return await db.query.results.findMany({
    where: eq(results.termId, termId),
    with: { submittedBy: { columns: { name: true } } },
    orderBy(fields, operators) {
      return operators.desc(fields.createdAt)
    }
  })
}

// ---------------------------------------------------------------------------
// Scoresheet queries
// ---------------------------------------------------------------------------

/**
 * Fetches a single scoresheet by ID with its subject scores included. Used by the teacher's
 * per-student score entry view and by router helpers that need to walk up to the parent result.
 */
export async function fetchSingleScoresheet(id: string) {
  return await db.query.scoresheets.findFirst({
    where: eq(scoresheets.id, id),
    with: {
      result: true,
      subjectScores: { with: { subject: { columns: { id: true, name: true } } } },
      student: { columns: { id: true, name: true, studentId: true } }
    }
  })
}

/**
 * Fetches a scoresheet together with its parent result in one query. Used in procedures that
 * receive a scoresheetId and need to check the result's status, classId, or scoreConfig without a
 * second round-trip.
 *
 * Shape returned: scoresheet └── result (with display relations)
 */
export async function fetchScoresheetWithResult(id: string) {
  return await db.query.scoresheets.findFirst({
    where: eq(scoresheets.id, id),
    with: { result: true }
  })
}

// ---------------------------------------------------------------------------
// SubjectScore queries
// ---------------------------------------------------------------------------

/**
 * Fetches a single subject score row by ID — no relations joined. Used by the router when it needs
 * to verify the row exists and retrieve its scoresheetId before walking up to the parent scoresheet
 * and result.
 */
export async function fetchSingleSubjectScore(id: string) {
  return await db.query.subjectScores.findFirst({
    where: eq(subjectScores.id, id)
  })
}

/**
 * Resolves the result that owns a given scoresheet, then returns both. Used in
 * scoresheet/subjectScore procedures that need to check result status and role permissions without
 * the caller having to do two lookups.
 */
export async function getResultForScoresheet(scoresheetId: string) {
  const scoresheet = await fetchScoresheetWithResult(scoresheetId)
  return scoresheet ?? null
}

/**
 * Report-card-specific variant of fetchResultWithScoresheets. Adds term (with session) and class
 * relations needed for the report card header.
 */
export async function fetchResultForReportCard(resultId: string) {
  return await db.query.results.findFirst({
    where: eq(results.id, resultId),
    with: {
      term: {
        columns: { id: true, name: true },
        with: { session: { columns: { name: true } } }
      },
      class: { columns: { id: true, name: true } },
      scoresheets: {
        with: {
          subjectScores: { with: { subject: { columns: { id: true, name: true } } } },
          student: { columns: { id: true, name: true, studentId: true } }
        }
      }
    }
  })
}
