import type { GradeBoundary } from "#shared/constants/kv-settings"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubjectScoreData {
  id: string
  subjectId: string | null
  caScores: (number | null)[]
  exam: number | null
}

export interface ScoresheetData {
  id: string
  studentId: string
  subjectScores: SubjectScoreData[]
}

export interface SubjectScoreMetrics {
  subjectScoreId: string
  subjectId: string | null
  caScores: (number | null)[]
  caTotal: number
  exam: number | null
  total: number
  grade: GradeBoundary | null
  subjectPosition: number | null
  subjectClassAverage: number | null
}

export interface ScoresheetMetrics {
  scoresheetId: string
  studentId: string
  subjects: SubjectScoreMetrics[]
  overallScore: number
  averageScore: number
  classPosition: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a stable grouping key for a subject score row. Subjects added from the master list have a
 * subjectId — we use that. Custom subjects added ad-hoc have no subjectId, so we fall back to the
 * row's own id, which is unique per scoresheet and still groups correctly when computing positions
 * and class averages across scoresheets.
 */
function subjectKey(score: SubjectScoreData): string {
  return score.subjectId ?? score.id
}

// ---------------------------------------------------------------------------
// Subject-level metrics
// ---------------------------------------------------------------------------

/**
 * Sums all non-null CA scores for a single subject score row. Null slots (not yet entered) are
 * treated as 0 for the running total.
 */
export function getCaTotal(caScores: (number | null)[]): number {
  return caScores.reduce<number>((sum, score) => sum + (score ?? 0), 0)
}

/** Returns the subject total: CA total + exam score. Null exam is treated as 0. */
export function getSubjectTotal(caScores: (number | null)[], exam: number | null): number {
  return getCaTotal(caScores) + (exam ?? 0)
}

/**
 * Maps a subject total to a GradeBoundary using the configured grading scale. Boundaries are
 * checked in order — first match wins. Returns null if the total falls outside all defined
 * boundaries.
 */
export function getSubjectGrade(
  total: number,
  gradeBoundaries: GradeBoundary[]
): GradeBoundary | null {
  return gradeBoundaries.find((b) => total >= b.min && total <= b.max) ?? null
}

// ---------------------------------------------------------------------------
// Scoresheet-level metrics
// ---------------------------------------------------------------------------

/** Sums all subject totals on a scoresheet to get the student's overall score. */
export function getOverallScore(subjectScores: SubjectScoreData[]): number {
  return subjectScores.reduce((sum, s) => sum + getSubjectTotal(s.caScores, s.exam), 0)
}

/**
 * Computes the student's average score: overall ÷ number of subjects. Returns 0 if there are no
 * subjects to avoid division by zero.
 */
export function getAverageScore(subjectScores: SubjectScoreData[]): number {
  if (subjectScores.length === 0) return 0
  return getOverallScore(subjectScores) / subjectScores.length
}

// ---------------------------------------------------------------------------
// Class-level ranking
// ---------------------------------------------------------------------------

/**
 * Assigns a class position to each scoresheet based on average score. Ties share the same position
 * (e.g. two students both 2nd means no 3rd). Returns a Map of scoresheetId → position (1-based).
 */
export function getClassPositions(scoresheets: ScoresheetData[]): Map<string, number> {
  const withAverages = scoresheets.map((sheet) => ({
    id: sheet.id,
    average: getAverageScore(sheet.subjectScores)
  }))

  const sorted = [...withAverages].sort((a, b) => b.average - a.average)

  const positions = new Map<string, number>()
  let currentPosition = 1

  sorted.forEach((entry, index) => {
    if (index > 0 && entry.average < sorted[index - 1]!.average) {
      currentPosition = index + 1
    }
    positions.set(entry.id, currentPosition)
  })

  return positions
}

/**
 * For a given subject key, computes each student's position within the class based on their total
 * score for that subject. Ties share the same position. Returns a Map of subjectScoreId → position
 * (1-based).
 */
export function getSubjectPositions(
  scoresheets: ScoresheetData[],
  key: string
): Map<string, number> {
  // Collect the matching subject score row from each scoresheet
  const entries = scoresheets.flatMap((sheet) => {
    const match = sheet.subjectScores.find((s) => subjectKey(s) === key)
    if (!match) return []
    return [{ subjectScoreId: match.id, total: getSubjectTotal(match.caScores, match.exam) }]
  })

  const sorted = [...entries].sort((a, b) => b.total - a.total)

  const positions = new Map<string, number>()
  let currentPosition = 1

  sorted.forEach((entry, index) => {
    if (index > 0 && entry.total < sorted[index - 1]!.total) {
      currentPosition = index + 1
    }
    positions.set(entry.subjectScoreId, currentPosition)
  })

  return positions
}

/**
 * Computes the class average for a specific subject key: sum of all students' totals ÷ number of
 * students who have it. Returns null if no student has that subject on their scoresheet.
 */
export function getSubjectClassAverage(scoresheets: ScoresheetData[], key: string): number | null {
  const totals = scoresheets.flatMap((sheet) => {
    const match = sheet.subjectScores.find((s) => subjectKey(s) === key)
    return match ? [getSubjectTotal(match.caScores, match.exam)] : []
  })

  if (totals.length === 0) return null
  return totals.reduce((sum, t) => sum + t, 0) / totals.length
}

// ---------------------------------------------------------------------------
// Composed result — enriches all scoresheets in a result at once
// ---------------------------------------------------------------------------

/**
 * The main entry point for report card rendering.
 *
 * Takes all scoresheets in a result and returns each one fully enriched with: - Per subject:
 * caTotal, total, grade, subjectPosition, subjectClassAverage - Per scoresheet: overallScore,
 * averageScore, classPosition
 *
 * All ranking and averaging is computed in a single pass so this function only needs to be called
 * once per report card load.
 */
export function computeResultMetrics(
  scoresheets: ScoresheetData[],
  gradeBoundaries: GradeBoundary[]
): ScoresheetMetrics[] {
  // Pre-compute class positions by average across all scoresheets
  const classPositions = getClassPositions(scoresheets)

  // Collect every unique subject key across all scoresheets
  const allSubjectKeys = [
    ...new Set(scoresheets.flatMap((sheet) => sheet.subjectScores.map(subjectKey)))
  ]

  // Pre-compute subject positions and class averages keyed by subject key
  const subjectPositionMaps = new Map(
    allSubjectKeys.map((key) => [key, getSubjectPositions(scoresheets, key)])
  )
  const subjectClassAverages = new Map(
    allSubjectKeys.map((key) => [key, getSubjectClassAverage(scoresheets, key)])
  )

  return scoresheets.map((sheet) => {
    const enrichedSubjects: SubjectScoreMetrics[] = sheet.subjectScores.map((s) => {
      const key = subjectKey(s)
      const caTotal = getCaTotal(s.caScores)
      const total = caTotal + (s.exam ?? 0)

      return {
        subjectScoreId: s.id,
        subjectId: s.subjectId,
        caScores: s.caScores,
        caTotal,
        exam: s.exam,
        total,
        grade: getSubjectGrade(total, gradeBoundaries),
        subjectPosition: subjectPositionMaps.get(key)?.get(s.id) ?? null,
        subjectClassAverage: subjectClassAverages.get(key) ?? null
      }
    })

    return {
      scoresheetId: sheet.id,
      studentId: sheet.studentId,
      subjects: enrichedSubjects,
      overallScore: getOverallScore(sheet.subjectScores),
      averageScore: getAverageScore(sheet.subjectScores),
      classPosition: classPositions.get(sheet.id) ?? null
    }
  })
}
