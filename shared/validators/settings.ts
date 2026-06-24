import { z } from "zod"

import { positionDisplayMode, TERMS_PRESET, type TermPreset } from "../constants/kv-settings"

export const SchoolSettingsSchema = z.object({
  sessionSuffix: z.string().min(1),
  termPreset: z.enum(Object.keys(TERMS_PRESET) as [TermPreset, ...TermPreset[]]),
  subjectTags: z.array(z.string()),
  autoGenerateStudentId: z.boolean(),
  studentIdPrefix: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-zA-Z]+$/, "Prefix must be alphabets only")
})

export type SchoolSettingsType = z.infer<typeof SchoolSettingsSchema>

// ---------------------------------------------------------------------------
// Result Settings
// ---------------------------------------------------------------------------

export const GradeBoundarySchema = z.object({
  label: z.string().min(1),
  min: z.coerce.number().int().min(0),
  max: z.coerce.number().int().max(100),
  remark: z.string().min(1)
})

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
