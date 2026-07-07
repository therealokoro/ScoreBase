import type { ScoreConfigSnapshot } from "../validators/results"
import type { GradeBoundary, PositionDisplayMode } from "../validators/settings"

// Input types — what the computation function receives
// ---------------------------------------------------------------------------
export type SubjectScoreInput = {
  id: string
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
 * so the first match is the tightest fit. Falls back to the boundary with the lowest min if nothing
 * matches (handles edge cases like score=0 with a boundary starting at min=0).
 */
export function getGradeBoundary(
  score: number,
  boundaries: GradeBoundary[]
): GradeBoundary | undefined {
  const sorted = [...boundaries].sort((a, b) => b.min - a.min)
  return sorted.find((b) => score >= b.min && score <= b.max)
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
  const studentTotals = allScoresheets.map((s) => {
    const rows = s.subjectScores.map((sc) => {
      const caTotal = sc.caScores.every((v) => v !== null)
        ? sc.caScores.reduce<number>((sum, v) => sum + (v ?? 0), 0)
        : null
      return caTotal !== null && sc.exam !== null ? caTotal + sc.exam : null
    })
    const complete = rows.every((r) => r !== null)
    const total = complete ? rows.reduce<number>((sum, r) => sum + (r ?? 0), 0) : null
    return { studentId: s.studentId, total }
  })

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
