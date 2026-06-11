import { z } from "zod"

import { TERMS_PRESET, type TermPreset } from "../constants/settings"

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

export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>
