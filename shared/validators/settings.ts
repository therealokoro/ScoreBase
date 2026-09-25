import { z } from "zod"

export const TERM_PRESET_KEYS = ["ordinals", "verbetim"] as const
export type TermPresetKeys = (typeof TERM_PRESET_KEYS)[number]

export const SchoolSettingsSchema = z.object({
  sessionSuffix: z.string().min(1),
  termPreset: z.enum(TERM_PRESET_KEYS),
  subjectTags: z.array(z.string()),
  autoGenerateStudentId: z.boolean(),
  activeSession: z.string().nullable(),
  activeTerm: z.string().nullable(),
  studentIdPrefix: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-zA-Z]+$/, "Prefix must be alphabets only")
})

export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>

// ---------------------------------------------------------------------------
// Result Settings
// ---------------------------------------------------------------------------

// "all"  → show every student's position on their report card
// "top"  → show position only for students ranked within topN
// "none" → never show position on report cards
export const positionDisplayMode = ["all", "top", "none"] as const

export type PositionDisplayMode = (typeof positionDisplayMode)[number]
export type PositionDisplayOption = { value: PositionDisplayMode; label: string }

export const GradeBoundarySchema = z.object({
  label: z.string().min(1),
  min: z.coerce.number().int().min(0),
  max: z.coerce.number().int().max(100),
  remark: z.string().min(1)
})

export type GradeBoundary = z.infer<typeof GradeBoundarySchema>

/**
 * Validates that an admin-defined grading scale is internally consistent: every boundary has
 * `min <= max` and the scale covers 0–100 without gaps. Returns an error message, or `null` when
 * valid. Used on the write path only — stored settings are not re-validated on read.
 */
export function validateGradeBoundaryCoverage(boundaries: GradeBoundary[]): string | null {
  const sorted = [...boundaries].sort((a, b) => a.min - b.min)
  let cursor = 0
  for (const b of sorted) {
    if (b.min > b.max) {
      return `Grade "${b.label}": minimum (${b.min}) is greater than maximum (${b.max})`
    }
    if (b.min > cursor) {
      return `Grade boundaries leave a gap between ${cursor} and ${b.min - 1}`
    }
    if (b.max >= cursor) cursor = b.max + 1
  }
  if (cursor <= 100) return `Grade boundaries do not cover scores ${cursor}–100`
  return null
}

const ResultSettingsBaseSchema = z.object({
  gradeBoundaries: z.array(GradeBoundarySchema).min(1),
  positionDisplayMode: z.enum(positionDisplayMode),
  positionTopN: z.coerce.number().int().min(1),
  caCount: z.coerce.number().int().min(1).max(5),
  caMaxScores: z.array(z.coerce.number().int().min(1)).min(1).max(5),
  examMax: z.coerce.number().int().min(1)
})

export const ResultSettingsSchema = ResultSettingsBaseSchema.refine(
  (val) => val.caMaxScores.length === val.caCount,
  { message: "caMaxScores must have exactly caCount entries", path: ["caMaxScores"] }
).refine((val) => val.caMaxScores.reduce((sum, n) => sum + n, 0) + val.examMax === 100, {
  message: "CA scores and exam max must sum to 100",
  path: ["examMax"]
})

// For the update endpoint — partial the base, skip the refine since
// partial updates may not have enough fields to check the sum invariant
export const PartialResultSettingsSchema = ResultSettingsBaseSchema.partial()

export type ResultSettingsType = z.infer<typeof ResultSettingsSchema>
