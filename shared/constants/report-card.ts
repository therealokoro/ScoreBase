import { typeid } from "typeid-js"

// ---------------------------------------------------------------------------
// Report Card Template — slot + block model
//
// A template is five ordered slots ("header", "studentInfo", "main", "sidebar",
// "footer"), each holding an ordered list of blocks. Every block is one of the
// seven types in `BlockType` and carries its own config (see
// `shared/validators/report-card.ts` for the matching Zod schemas).
//
// NOTE: defaults come from `createDefaultReportCardTemplate()` — a function, not a
// constant — because `typeid()` must generate fresh IDs on every call.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Text styling
// ---------------------------------------------------------------------------

export type TextAlign = "left" | "center" | "right"

export interface TextStyle {
  fontSize: number // px, 10–28
  fontWeight: "normal" | "bold"
  color: string // hex e.g. "#000000"
  align: TextAlign
}

export interface StyledText {
  value: string
  style: TextStyle
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 14,
  fontWeight: "normal",
  color: "#000000",
  align: "left"
}

// ---------------------------------------------------------------------------
// Slots, blocks, and the template shape
// ---------------------------------------------------------------------------

export type Slot = "header" | "studentInfo" | "main" | "sidebar" | "footer"

/** Font choices offered globally and per block. */
export const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Script", value: "cursive" }
] as const

export const DEFAULT_FONT_FAMILY = FONT_FAMILIES[0].value

/** The five slots in their fixed render order on the A4 canvas. */
export const REPORT_CARD_SLOTS = ["header", "studentInfo", "main", "sidebar", "footer"] as const

export const REPORT_CARD_BLOCK_TYPES = [
  "school-info",
  "student-info",
  "scores",
  "custom-table",
  "grading-key",
  "psychomotor",
  "summary",
  "remarks"
] as const

export type BlockType = (typeof REPORT_CARD_BLOCK_TYPES)[number]

export interface ReportCardBlockBase {
  id: string // typeid("block")
  hidden: boolean // hides without deleting
  /** Optional per-block font override; null inherits the template's font family. */
  fontFamily: string | null
}

export interface SchoolInfoBlock extends ReportCardBlockBase {
  type: "school-info"
  config: SchoolInfoConfig
}

export interface StudentInfoBlock extends ReportCardBlockBase {
  type: "student-info"
  config: StudentInfoConfig
}

export interface ScoresBlock extends ReportCardBlockBase {
  type: "scores"
  config: ScoresConfig
}

export interface CustomTableBlock extends ReportCardBlockBase {
  type: "custom-table"
  config: CustomTableConfig
}

export interface GradingKeyBlock extends ReportCardBlockBase {
  type: "grading-key"
  config: GradingKeyConfig
}

/** Psychomotor skills table — sidebar-only, values are teacher-entered per student. */
export interface PsychomotorBlock extends ReportCardBlockBase {
  type: "psychomotor"
  config: PsychomotorConfig
}

export interface SummaryBlock extends ReportCardBlockBase {
  type: "summary"
  config: SummaryConfig
}

export interface RemarksBlock extends ReportCardBlockBase {
  type: "remarks"
  config: RemarksConfig
}

/** Discriminated on `type` — mirrors `ReportCardBlockSchema` in shared/validators/report-card.ts. */
export type ReportCardBlock =
  | SchoolInfoBlock
  | StudentInfoBlock
  | ScoresBlock
  | CustomTableBlock
  | GradingKeyBlock
  | PsychomotorBlock
  | SummaryBlock
  | RemarksBlock

export type WatermarkSource = "logo" | "custom"

export interface Watermark {
  source: WatermarkSource
  imageUrl: string | null // NuxtHub Blob pathname — only used when source is "custom"
  opacity: number // 0–1
  size: "small" | "medium" | "large"
  mode: "single" | "tiled"
}

export type SidebarPosition = "left" | "right"

export interface ReportCardTemplate {
  id: string // typeid("template")
  /** Global font family for all report card text (blocks can override it). */
  fontFamily: string
  // Sidebar layout is derived: it kicks in whenever `sidebar` has blocks.
  sidebarPosition: SidebarPosition
  watermark: Watermark | null
  header: ReportCardBlock[]
  studentInfo: ReportCardBlock[]
  main: ReportCardBlock[]
  sidebar: ReportCardBlock[]
  footer: ReportCardBlock[]
}

// ---------------------------------------------------------------------------
// Block configs
// ---------------------------------------------------------------------------

/** Whether a labelled value shows its label above the value or beside it. */
export type LabelPlacement = "top" | "side"

// -- school-info ------------------------------------------------------------

export type LogoPlacement = "left" | "center" | "right" | "left-right"

/** Rendered logo heights in px. Capped so a header always fits on an A4 page. */
export const LOGO_SIZE_MAP: Record<"small" | "medium" | "large", number> = {
  small: 56,
  medium: 72,
  large: 96
}

export type LogoSize = keyof typeof LOGO_SIZE_MAP

export interface SchoolInfoConfig {
  logoPlacement: LogoPlacement
  logoSize: LogoSize
  logoPrimary: string | null // NuxtHub Blob pathname
  logoSecondary: string | null // used when logoPlacement is "center" or "left-right"
  // When logoSecondary is null and two logo slots are shown, logoPrimary fills both.
  schoolName: StyledText
  address: StyledText
  motto: StyledText
  extraText: StyledText // e.g. phone, email, website
}

// -- student-info -----------------------------------------------------------

// The four fields every report card historically showed, in their canonical display order.
// The template's student-info block also uses these as toggle keys (Phase 6 legacy UI).
export type InfoField = "student" | "class" | "session" | "term"

export type StudentInfoField =
  | "student.name"
  | "student.id"
  | "student.class"
  | "class.size"
  | "term.name"
  | "session.name"
  | "result.average"
  | "result.position"

export interface StudentInfoFieldRow {
  id: string // typeid("field")
  field: StudentInfoField
  label: string // e.g. "Student Name" — admin-editable
}

export type StudentInfoBorderStyle = "outlined" | "borderless" | "bordered"

export interface StudentInfoConfig {
  columns: 2 | 3 | 4
  borderStyle: StudentInfoBorderStyle
  labelPlacement: LabelPlacement
  fields: StudentInfoFieldRow[]
}

// -- scores -----------------------------------------------------------------

// CA count is ALWAYS dynamic — read scoreConfig.caCount, never hardcode.
export type ScoreColumnId =
  | "subject"
  | `ca${number}` // ca1, ca2, ca3 … up to scoreConfig.caCount
  | "caTotal"
  | "exam"
  | "total"
  | "classHighest"
  | "classLowest"
  | "classAverage"
  | "grade"
  | "remark"
  | "subjectPosition"

export type ScoresCaMode = "breakdown" | "summed"

export interface ScoresConfig {
  caMode: ScoresCaMode
  // "breakdown" → individual CA columns; "summed" → single CA Total column.
  // These are independent — both, either, or neither can be on.
  columns: ScoreColumnId[] // ordered list of visible columns; always starts with "subject"
  // "separate" → one head per CA column; "grouped" → a single head spanning the CA columns.
  caHeading: "separate" | "grouped"
}

// -- custom-table -----------------------------------------------------------

export type CustomTableVariant = "static" | "manual"

export interface CustomTableRow {
  id: string // typeid("row")
  label: string
  value: string // only used when variant is "static"
}

export interface CustomTableConfig {
  variant: CustomTableVariant
  title: StyledText
  rows: CustomTableRow[]
}

// -- grading-key ------------------------------------------------------------

export type GradingKeyDisplay = "grade" | "remark"

// Grade data always comes live from result settings' KV gradeBoundaries; the block only
// chooses whether the grade or its remark is shown next to the value range.
export interface GradingKeyConfig {
  title: StyledText
  display: GradingKeyDisplay
}

// -- psychomotor ------------------------------------------------------------

export interface PsychomotorRow {
  id: string // typeid("row")
  label: string // the skill, e.g. "Handwriting"
}

// Values are entered per student at scoresheet time (manualValues, Phase 12).
export interface PsychomotorConfig {
  title: StyledText
  rows: PsychomotorRow[]
}

/** Default psychomotor skills offered when a psychomotor block is added. */
export const DEFAULT_PSYCHOMOTOR_SKILLS = [
  "Handwriting",
  "Verbal Fluency",
  "Sports and Games",
  "Handling of Tools",
  "Drawing and Painting",
  "Musical Skills",
  "Neatness",
  "Punctuality"
] as const

// -- summary ----------------------------------------------------------------

export type SummaryMetric =
  | "marksObtainable" // sum of all subject max scores from scoreConfig
  | "marksObtained" // student's grandTotal
  | "subjectsOffered" // count of subjects in the scoresheet
  | "average"
  | "position"
  | "positionOutOf"

export type SummaryStyle = "inline" | "grid"

export interface SummaryConfig {
  metrics: SummaryMetric[]
  // "inline" → horizontal row of labelled values
  // "grid"   → 2-column key/value pairs
  style: SummaryStyle
  labelPlacement: LabelPlacement
}

// -- remarks ----------------------------------------------------------------

export type SignatureMode = "blank" | "image"

export interface RemarksSignatureConfig {
  visible: boolean
  label: StyledText // e.g. "Class Teacher's Remark"
  /** Whether the label sits above the comment or beside it. */
  commentLabelPlacement: LabelPlacement
  showSignature: boolean
  signatureMode: SignatureMode
  signatureImage: string | null // NuxtHub Blob pathname
  signatureLabel: StyledText // e.g. "Class Teacher"
}

export interface RemarksConfig {
  teacher: RemarksSignatureConfig
  principal: RemarksSignatureConfig
}

// ---------------------------------------------------------------------------
// Manual values (per-student teacher-entered data, stored on the scoresheet row)
// ---------------------------------------------------------------------------

export type ManualValues = {
  [blockId: string]: {
    [fieldKey: string]: string
    // For custom-table: fieldKey is the row's id
    // For remarks:      fieldKey is "teacher" or "principal"
  }
}

// ---------------------------------------------------------------------------
// Asset keys (NuxtHub Blob pathnames under report-card/)
// ---------------------------------------------------------------------------

export type ReportCardAssetKey =
  | "logo-primary"
  | "logo-secondary"
  | "sig-teacher"
  | "sig-principal"
  | "watermark"

// ---------------------------------------------------------------------------
// Default block configs
//
// One factory per block type so the default template and the builder's block palette
// (Phase 10) share a single source of truth. Styles are always spread so callers never
// mutate the shared DEFAULT_TEXT_STYLE object.
// ---------------------------------------------------------------------------

export function createDefaultSchoolInfoConfig(): SchoolInfoConfig {
  return {
    logoPlacement: "left",
    logoSize: "medium",
    logoPrimary: null,
    logoSecondary: null,
    schoolName: {
      value: "",
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 16, fontWeight: "bold", align: "center" }
    },
    address: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11, align: "center" } },
    motto: {
      value: "",
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 11, fontWeight: "bold", align: "center" }
    },
    extraText: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 10, align: "center" } }
  }
}

export function createDefaultStudentInfoConfig(): StudentInfoConfig {
  return {
    columns: 3,
    borderStyle: "outlined",
    labelPlacement: "top",
    fields: [
      { id: typeid("field").toString(), field: "student.name", label: "Student Name" },
      { id: typeid("field").toString(), field: "student.id", label: "Student ID" },
      { id: typeid("field").toString(), field: "student.class", label: "Class" },
      { id: typeid("field").toString(), field: "session.name", label: "Session" },
      { id: typeid("field").toString(), field: "term.name", label: "Term" }
    ]
  }
}

export function createDefaultScoresConfig(): ScoresConfig {
  return {
    caMode: "summed",
    columns: ["subject", "caTotal", "exam", "total", "grade", "remark"],
    caHeading: "separate"
  }
}

export function createDefaultCustomTableConfig(): CustomTableConfig {
  return {
    variant: "static",
    title: { value: "Custom Table", style: { ...DEFAULT_TEXT_STYLE, fontSize: 12 } },
    rows: [{ id: typeid("row").toString(), label: "Label", value: "" }]
  }
}

/** Grade data comes live from result settings — the block only picks grade or remark. */
export function createDefaultGradingKeyConfig(): GradingKeyConfig {
  return {
    title: { value: "Grading Key", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } },
    display: "grade"
  }
}

/** Seeds the psychomotor table with the standard skills list (editable afterwards). */
export function createDefaultPsychomotorConfig(
  skills: readonly string[] = DEFAULT_PSYCHOMOTOR_SKILLS
): PsychomotorConfig {
  return {
    title: { value: "Psychomotor Skills", style: { ...DEFAULT_TEXT_STYLE, fontSize: 12 } },
    rows: skills.map((label) => ({ id: typeid("row").toString(), label }))
  }
}

export function createDefaultSummaryConfig(): SummaryConfig {
  return {
    metrics: ["marksObtained", "average", "position", "positionOutOf"],
    style: "inline",
    labelPlacement: "top"
  }
}

export function createDefaultRemarksConfig(): RemarksConfig {
  return {
    teacher: {
      visible: true,
      label: { value: "Class Teacher's Remark", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } },
      commentLabelPlacement: "top",
      showSignature: true,
      signatureMode: "blank",
      signatureImage: null,
      signatureLabel: { value: "Class Teacher", style: { ...DEFAULT_TEXT_STYLE, fontSize: 10 } }
    },
    principal: {
      visible: true,
      label: { value: "Principal's Remark", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } },
      commentLabelPlacement: "top",
      showSignature: true,
      signatureMode: "blank",
      signatureImage: null,
      signatureLabel: { value: "Principal", style: { ...DEFAULT_TEXT_STYLE, fontSize: 10 } }
    }
  }
}

// ---------------------------------------------------------------------------
// Default template
// ---------------------------------------------------------------------------

/**
 * Builds the default template with fresh IDs on every call. It is a function (not a constant)
 * because `typeid()` must not hand the same ID to two blocks, and because callers treat the result
 * as an owned working copy.
 */
export function createDefaultReportCardTemplate(): ReportCardTemplate {
  return {
    id: typeid("template").toString(),
    fontFamily: DEFAULT_FONT_FAMILY,
    sidebarPosition: "right",
    watermark: null,
    header: [
      {
        id: typeid("block").toString(),
        type: "school-info",
        hidden: false,
        fontFamily: null,
        config: createDefaultSchoolInfoConfig()
      }
    ],
    studentInfo: [
      {
        id: typeid("block").toString(),
        type: "student-info",
        hidden: false,
        fontFamily: null,
        config: createDefaultStudentInfoConfig()
      }
    ],
    main: [
      {
        id: typeid("block").toString(),
        type: "scores",
        hidden: false,
        fontFamily: null,
        config: createDefaultScoresConfig()
      }
    ],
    sidebar: [],
    footer: [
      {
        id: typeid("block").toString(),
        type: "summary",
        hidden: false,
        fontFamily: null,
        config: createDefaultSummaryConfig()
      },
      {
        id: typeid("block").toString(),
        type: "remarks",
        hidden: false,
        fontFamily: null,
        config: createDefaultRemarksConfig()
      }
    ]
  }
}
