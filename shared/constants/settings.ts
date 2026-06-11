export const TERMS_PRESET = {
  ordinals: ["1st Term", "2nd Term", "3rd Term"],
  verbatim: ["First Term", "Second Term", "Third Term"]
} as const

export type TermPreset = keyof typeof TERMS_PRESET

export const TERM_PRESET_OPTIONS = Object.keys(TERMS_PRESET) as TermPreset[]
export interface SchoolSettings {
  sessionSuffix: string
  termPreset: TermPreset
  subjectTags: string[]
  autoGenerateStudentId: boolean
  studentIdPrefix: string
}
export const DEFAULT_SETTINGS: SchoolSettings = {
  sessionSuffix: "Session",
  termPreset: "ordinals",
  subjectTags: ["Art", "Science", "Religous", "Business", "Core"],
  autoGenerateStudentId: true,
  studentIdPrefix: "STU"
}
