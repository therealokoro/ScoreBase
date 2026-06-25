// ---------------------------------------------------------------------------
// School Settings

import {
  type TermPresetKeys,
  type PositionDisplayMode,
  type SchoolSettings
} from "../validators/settings"

// ---------------------------------------------------------------------------

export const TERMS_PRESET: Record<TermPresetKeys, string[]> = {
  ordinals: ["1st Term", "2nd Term", "3rd Term"],
  verbetim: ["First Term", "Second Term", "Third Term"]
} as const

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  sessionSuffix: "Session",
  termPreset: "ordinals",
  subjectTags: ["Art", "Science", "Religous", "Business", "Core"],
  autoGenerateStudentId: true,
  studentIdPrefix: "STU",
  activeSession: null,
  activeTerm: null
}

// ---------------------------------------------------------------------------
// Result Settings
// ---------------------------------------------------------------------------

export interface GradeBoundary {
  label: string // e.g. "A1"
  min: number // lower bound (inclusive)
  max: number // upper bound (inclusive)
  remark: string // e.g. "Excellent"
}

// Default scale follows the standard WAEC/NECO grading used in Nigerian
// secondary schools. Admin can override any boundary from the settings page.
export const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { label: "A", min: 70, max: 100, remark: "Excellent" },
  { label: "B", min: 60, max: 69, remark: "Very Good" },
  { label: "C", min: 50, max: 59, remark: "Good" },
  { label: "D", min: 45, max: 49, remark: "Pass" },
  { label: "E", min: 40, max: 44, remark: "Fair" },
  { label: "F", min: 0, max: 39, remark: "Fail" }
]

export interface ResultSettings {
  gradeBoundaries: GradeBoundary[]
  positionDisplayMode: PositionDisplayMode
  positionTopN: number
  // Number of CA assessments per subject (1–5)
  caCount: number
  // Max score per CA slot — length must equal caCount.
  // Each entry is independently configurable (e.g. [20, 10, 10] for 3 CAs).
  // sum(caMaxScores) + examMax must equal 100.
  caMaxScores: number[]
  examMax: number
}

export const DEFAULT_RESULT_SETTINGS: ResultSettings = {
  gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
  positionDisplayMode: "all",
  positionTopN: 3,
  caCount: 3,
  caMaxScores: [10, 10, 10],
  examMax: 70
}
