import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

import { results, scoresheets, subjectScores } from "../db/schema"

// ---------------------------------------------------------------------------
// Result queries
// ---------------------------------------------------------------------------

/**
 * Fetches every result row with no filtering. Used by admins who have visibility across all
 * classes.
 */
export async function listAllResults() {
  return db.query.results.findMany()
}

/**
 * Fetches all results that belong to a specific class. Used to scope the list view for teachers
 * (who can only see their class).
 */
export async function listResultsByClass(classId: string) {
  return db.query.results.findMany({
    where: eq(results.classId, classId)
  })
}

/**
 * Fetches a single result row by its ID — no relations joined. Used internally in the router when
 * you only need the result's own fields (e.g. to check status, scoreConfig, or classId before doing
 * further work).
 */
export async function fetchSingleResult(id: string) {
  return db.query.results.findFirst({
    where: eq(results.id, id)
  })
}

/**
 * Fetches a result with all its scoresheets and each scoresheet's subject scores fully nested. This
 * is the "full detail" shape used by the score entry page and the report card.
 *
 * Shape returned: result └── scoresheets[] └── subjectScores[]
 */
export async function fetchResultWithScoresheets(id: string) {
  return db.query.results.findFirst({
    where: eq(results.id, id),
    with: {
      scoresheets: {
        with: {
          subjectScores: true
        }
      }
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
  return db.query.scoresheets.findFirst({
    where: eq(scoresheets.id, id),
    with: {
      subjectScores: true
    }
  })
}

/**
 * Fetches a scoresheet together with its parent result in one query. Used in procedures that
 * receive a scoresheetId and need to check the result's status, classId, or scoreConfig without a
 * second round-trip.
 *
 * Shape returned: scoresheet └── result (flat, no further nesting)
 */
export async function fetchScoresheetWithResult(id: string) {
  return db.query.scoresheets.findFirst({
    where: eq(scoresheets.id, id),
    with: {
      result: true
    }
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
  return db.query.subjectScores.findFirst({
    where: eq(subjectScores.id, id)
  })
}

/**
 * Resolves the result that owns a given scoresheet, then returns both. Used in
 * scoresheet/subjectScore procedures that need to check result status and role permissions without
 * the caller having to do two separate lookups.
 */
export async function getResultForScoresheet(scoresheetId: string) {
  // fetchScoresheetWithResult joins scoresheets → results in one query
  const scoresheet = await fetchScoresheetWithResult(scoresheetId)
  return scoresheet ?? null
}
