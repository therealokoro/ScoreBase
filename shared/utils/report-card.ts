import type { ScoreConfigSnapshot } from "../validators/results"
import type { GradeBoundary, PositionDisplayMode } from "../validators/settings"

// Input types — what the computation function receives
// ---------------------------------------------------------------------------
export type SubjectScoreInput = {
  id: string
  subjectId: string | null
  subjectName: string
  caScores: (number | null)[]
  exam: number | null
}

export type ScoresheetInput = {
  scoresheetId: string
  studentId: string
  studentName: string
  studentSchoolId: string
  subjectScores: SubjectScoreInput[]
}

// Output types — what the computation function produces
// ---------------------------------------------------------------------------
export type ComputedSubjectRow = {
  id: string
  subjectId: string | null
  subjectName: string
  caScores: (number | null)[]
  caTotal: number | null // sum of caScores; null if any slot is still null
  exam: number | null
  total: number | null // caTotal + exam; null if either is null
  grade: string // e.g. "A", "B" — empty string if total is null
  remark: string // e.g. "Excellent" — empty string if total is null
}

export type ComputedReportCard = {
  studentName: string
  studentSchoolId: string
  subjectRows: ComputedSubjectRow[]
  // Aggregate stats — null when any subject is still incomplete
  grandTotal: number | null
  subjectCount: number
  average: number | null // grandTotal / subjectCount, 2 dp
  position: string // e.g. "1st", "2nd", "" when mode is "none" or not in topN
  positionRank: number | null // raw rank regardless of display mode, for sorting
}

// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the grade boundary that covers `score`, scanning boundaries in descending order of `min`
 * so the first match is the tightest fit. If no boundary contains the score (e.g. an admin-defined
 * gap), falls back to the nearest boundary below the score, then to the lowest boundary — so a
 * score never maps to a blank grade.
 */
export function getGradeBoundary(
  score: number,
  boundaries: GradeBoundary[]
): GradeBoundary | undefined {
  if (boundaries.length === 0) return undefined
  const sorted = [...boundaries].sort((a, b) => b.min - a.min)
  const exact = sorted.find((b) => score >= b.min && score <= b.max)
  if (exact) return exact
  const below = sorted.find((b) => score >= b.min)
  return below ?? sorted[sorted.length - 1]
}

/**
 * Converts a 1-based rank integer to an ordinal string: 1→"1st", 2→"2nd", etc. Handles the
 * 11th/12th/13th exception correctly.
 */
export function toOrdinal(n: number): string {
  const abs = Math.abs(n)
  const mod100 = abs % 100
  const mod10 = abs % 10
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

/**
 * Formats a position rank for display, applying positionDisplayMode and positionTopN rules. Returns
 * an empty string when the position should not be shown on this student's report card.
 */
export function formatPosition(
  rank: number | null,
  mode: PositionDisplayMode,
  topN: number
): string {
  if (rank === null || mode === "none") return ""
  if (mode === "top" && rank > topN) return ""
  return toOrdinal(rank)
}

// ---------------------------------------------------------------------------
// Grand totals (shared with the class-wide summary)
// ---------------------------------------------------------------------------

/**
 * A single subject's total for one student: CA sum + exam. Returns `null` when any CA slot or the
 * exam is still empty, so incomplete subjects never pollute class statistics.
 */
function computeSubjectTotal(score: SubjectScoreInput): number | null {
  const caComplete = score.caScores.every((s) => s !== null)
  if (!caComplete || score.exam === null) return null
  return score.caScores.reduce<number>((sum, s) => sum + (s ?? 0), 0) + score.exam
}

/**
 * Grand total of a single scoresheet: the sum of each subject's `caTotal + exam`. Returns `null`
 * when any subject still has an incomplete CA slot or exam, matching the "incomplete = unranked"
 * rule used for position.
 */
function computeScoresheetTotal(scoresheet: ScoresheetInput): number | null {
  const rows = scoresheet.subjectScores.map((score) => computeSubjectTotal(score))
  return rows.every((r) => r !== null) ? rows.reduce<number>((sum, r) => sum + (r ?? 0), 0) : null
}

/** Per-subject class pool, used by the scores block's class-statistics columns. */
export type SubjectClassData = {
  subjectId: string
  totals: number[]
}

/**
 * Groups every student's subject total by subject. Students whose score for that subject is still
 * incomplete are skipped for that subject only (unlike the overall ranking, which excludes the
 * whole student). Soft-deleted subjects (`subjectId === null`) are ignored.
 */
export function computeSubjectClassData(sheets: ScoresheetInput[]): SubjectClassData[] {
  const bySubject = new Map<string, number[]>()

  for (const sheet of sheets) {
    for (const score of sheet.subjectScores) {
      if (score.subjectId === null) continue
      const total = computeSubjectTotal(score)
      if (total === null) continue
      const totals = bySubject.get(score.subjectId) ?? []
      totals.push(total)
      bySubject.set(score.subjectId, totals)
    }
  }

  return [...bySubject].map(([subjectId, totals]) => ({ subjectId, totals }))
}

/**
 * Grand totals of every fully-scored scoresheet, in input order. Students with any incomplete
 * subject are omitted (they are unranked), so this is the class-wide total pool used for the class
 * summary statistics (highest, lowest, average).
 */
export function computeStudentTotals(allScoresheets: ScoresheetInput[]): number[] {
  const totals: number[] = []
  for (const sheet of allScoresheets) {
    const total = computeScoresheetTotal(sheet)
    if (total !== null) totals.push(total)
  }
  return totals
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Computes a single student's report card row data from raw DB values.
 *
 * `allScoresheets` must include ALL students in the class (not just this one) so class-wide
 * position can be ranked correctly. The student's own scoresheet must be included in
 * `allScoresheets`.
 *
 * Grade boundaries and positionDisplayMode are read fresh from ResultSettings at render time — they
 * are NOT snapshotted on the result row. Only the score distribution (caCount, caMaxScores,
 * examMax) is frozen.
 */
export function computeReportCard(
  scoresheet: ScoresheetInput,
  allScoresheets: ScoresheetInput[],
  scoreConfig: ScoreConfigSnapshot,
  gradeBoundaries: GradeBoundary[],
  positionMode: PositionDisplayMode,
  positionTopN: number
): ComputedReportCard {
  // -- Subject rows for this student --
  const subjectRows: ComputedSubjectRow[] = scoresheet.subjectScores.map((score) => {
    const caTotal = score.caScores.every((s) => s !== null)
      ? score.caScores.reduce<number>((sum, s) => sum + (s ?? 0), 0)
      : null

    const total =
      caTotal !== null && score.exam !== null ? +(caTotal + score.exam).toFixed(2) : null

    const boundary = total !== null ? getGradeBoundary(total, gradeBoundaries) : undefined

    return {
      id: score.id,
      subjectId: score.subjectId,
      subjectName: score.subjectName,
      caScores: score.caScores,
      caTotal,
      exam: score.exam,
      total,
      grade: boundary?.label ?? "",
      remark: boundary?.remark ?? ""
    }
  })

  // -- Aggregate stats --
  const allComplete = subjectRows.every((r) => r.total !== null)
  const subjectCount = subjectRows.length
  const grandTotal = allComplete
    ? +subjectRows.reduce((sum, r) => sum + (r.total ?? 0), 0).toFixed(2)
    : null
  const average = grandTotal !== null ? +(grandTotal / subjectCount).toFixed(2) : null

  // -- Position — rank all students by grandTotal, descending --
  // Students with any incomplete subject score are treated as unranked (null total).
  // Ties share the same rank (dense ranking: 1, 2, 2, 3 not 1, 2, 2, 4).
  const studentTotals = allScoresheets.map((s) => ({
    studentId: s.studentId,
    total: computeScoresheetTotal(s)
  }))

  const uniqueSortedTotals = [
    ...new Set(
      studentTotals
        .map((s) => s.total)
        .filter((t): t is number => t !== null)
        .sort((a, b) => b - a)
    )
  ]

  const positionRank = grandTotal !== null ? uniqueSortedTotals.indexOf(grandTotal) + 1 : null

  const position = formatPosition(positionRank, positionMode, positionTopN)

  return {
    studentName: scoresheet.studentName,
    studentSchoolId: scoresheet.studentSchoolId,
    subjectRows,
    grandTotal,
    subjectCount,
    average,
    position,
    positionRank
  }
}
