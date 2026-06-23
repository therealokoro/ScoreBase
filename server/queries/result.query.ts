import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

import { results, scoresheets, subjectScores } from "../db/schema"

// ---------------------------------------------------------------------------
// Shared utility — derive the human-readable result name from relations
// ---------------------------------------------------------------------------

/**
 * Derives the display name for a result from its nested term/session/class. e.g. "2024/2025 - 1st
 * Term - JSS1A"
 */
function getResultDisplayName(result: {
  term: { name: string; session: { name: string } }
  class: { name: string }
}): string {
  const sessionName = result.term.session.name.split(" ")[0] // get only the session date without the prefix
  return `${sessionName} - ${result.term.name} - ${result.class.name}`
}

// ---------------------------------------------------------------------------
// Shared relation presets
// ---------------------------------------------------------------------------

/**
 * Minimal relations needed to derive the display name of a result. Produces: "2024/2025 - 1st Term
 * - JSS1A"
 */
const resultDisplayRelations = {
  term: {
    columns: { name: true },
    with: { session: { columns: { name: true } } }
  },
  class: { columns: { name: true, id: true } }
} as const

// ---------------------------------------------------------------------------
// Result queries
// ---------------------------------------------------------------------------

/**
 * Fetches every result row with display relations (term → session, class). Used by admins who have
 * visibility across all classes.
 */
export async function listAllResults() {
  const rows = await db.query.results.findMany({
    with: resultDisplayRelations
  })

  return rows.map((curr) => {
    return { ...curr, name: getResultDisplayName(curr) }
  })
}

/**
 * Fetches all results that belong to a specific class with display relations. Used to scope the
 * list view for teachers (who can only see their class).
 */
export async function listResultsByClass(classId: string) {
  const rows = await db.query.results.findMany({
    where: eq(results.classId, classId),
    with: resultDisplayRelations
  })

  return rows.map((curr) => {
    return { ...curr, name: getResultDisplayName(curr) }
  })
}

/**
 * Fetches a single result row by its ID with display relations. Used internally in the router when
 * you need the result's own fields (e.g. to check status, scoreConfig, or classId) plus its display
 * name.
 */
export async function fetchSingleResult(id: string) {
  const res = await db.query.results.findFirst({
    where: eq(results.id, id),
    with: resultDisplayRelations
  })
  return res ? { ...res, name: getResultDisplayName(res) } : null
}

/**
 * Fetches a result with all its scoresheets and each scoresheet's subject scores fully nested. This
 * is the "full detail" shape used by the score entry page and the report card.
 *
 * Shape returned: result (with display relations) └── scoresheets[] ├── student (id, name,
 * studentId) └── subjectScores[]
 */
export async function fetchResultWithScoresheets(id: string) {
  const res = await db.query.results.findFirst({
    where: eq(results.id, id),
    with: {
      ...resultDisplayRelations,
      scoresheets: {
        with: {
          subjectScores: { with: { subject: true } },
          // Needed so the scoresheet list on the result page can display
          // each student's name without a separate fetch
          student: { columns: { id: true, name: true, studentId: true } }
        }
      }
    }
  })

  return res ? { ...res, name: getResultDisplayName(res) } : null
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
      subjectScores: { with: { subject: true } },
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
    with: {
      result: {
        with: resultDisplayRelations
      }
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
