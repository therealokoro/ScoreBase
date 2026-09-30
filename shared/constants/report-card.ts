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

export type BlockType =
  | "school-info"
  | "student-info"
  | "scores"
  | "custom-table"
  | "grading-key"
  | "summary"
  | "remarks"

export interface ReportCardBlockBase {
  id: string // typeid("block")
  hidden: boolean // hides without deleting
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
  | SummaryBlock
  | RemarksBlock

export interface Watermark {
  imageUrl: string // NuxtHub Blob pathname
  opacity: number // 0–1
  size: "small" | "medium" | "large"
  mode: "single" | "tiled"
}

export type ReportCardLayout = "full" | "sidebar"

export interface ReportCardTemplate {
  id: string // typeid("template")
  name: string
  layout: ReportCardLayout
  sidebarPosition: "left" | "right" | null // null when layout is "full"
  watermark: Watermark | null
  header: ReportCardBlock[]
  studentInfo: ReportCardBlock[]
  main: ReportCardBlock[]
  sidebar: ReportCardBlock[] // always [] when layout is "full"
  footer: ReportCardBlock[]
}

// ---------------------------------------------------------------------------
// Block configs
// ---------------------------------------------------------------------------

// -- school-info ------------------------------------------------------------

export type LogoPlacement = "left" | "center" | "right" | "left-right"

export interface SchoolInfoConfig {
  logoPlacement: LogoPlacement
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
  | "result.positionOutOf"

export interface StudentInfoFieldRow {
  id: string // typeid("field")
  field: StudentInfoField
  label: string // e.g. "Student Name" — admin-editable
}

export type StudentInfoBorderStyle = "outlined" | "borderless" | "shaded-labels"

export interface StudentInfoConfig {
  columns: 2 | 3 | 4
  borderStyle: StudentInfoBorderStyle
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

// Grade data always comes from getResultSettings() — no manual entry.
export interface GradingKeyConfig {
  title: StyledText
}

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
}

// -- remarks ----------------------------------------------------------------

export type SignatureMode = "blank" | "image"

export interface RemarksSignatureConfig {
  visible: boolean
  label: StyledText // e.g. "Class Teacher's Remark"
  showComment: boolean
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
    name: "Default Template",
    layout: "full",
    sidebarPosition: null,
    watermark: null,
    header: [
      {
        id: typeid("block").toString(),
        type: "school-info",
        hidden: false,
        config: {
          logoPlacement: "left",
          logoPrimary: null,
          logoSecondary: null,
          schoolName: {
            value: "",
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 18, fontWeight: "bold", align: "center" }
          },
          address: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 12, align: "center" } },
          motto: {
            value: "",
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 12, fontWeight: "bold", align: "center" }
          },
          extraText: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11, align: "center" } }
        } satisfies SchoolInfoConfig
      }
    ],
    studentInfo: [
      {
        id: typeid("block").toString(),
        type: "student-info",
        hidden: false,
        config: {
          columns: 3,
          borderStyle: "outlined",
          fields: [
            { id: typeid("field").toString(), field: "student.name", label: "Student Name" },
            { id: typeid("field").toString(), field: "student.id", label: "Student ID" },
            { id: typeid("field").toString(), field: "student.class", label: "Class" },
            { id: typeid("field").toString(), field: "session.name", label: "Session" },
            { id: typeid("field").toString(), field: "term.name", label: "Term" }
          ]
        } satisfies StudentInfoConfig
      }
    ],
    main: [
      {
        id: typeid("block").toString(),
        type: "scores",
        hidden: false,
        config: {
          caMode: "summed",
          columns: ["subject", "caTotal", "exam", "total", "grade", "remark"]
        } satisfies ScoresConfig
      }
    ],
    sidebar: [],
    footer: [
      {
        id: typeid("block").toString(),
        type: "summary",
        hidden: false,
        config: {
          metrics: ["marksObtained", "average", "position", "positionOutOf"],
          style: "inline"
        } satisfies SummaryConfig
      },
      {
        id: typeid("block").toString(),
        type: "remarks",
        hidden: false,
        config: {
          teacher: {
            visible: true,
            label: { value: "Class Teacher's Remark", style: DEFAULT_TEXT_STYLE },
            showComment: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: { value: "Class Teacher", style: DEFAULT_TEXT_STYLE }
          },
          principal: {
            visible: true,
            label: { value: "Principal's Remark", style: DEFAULT_TEXT_STYLE },
            showComment: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: { value: "Principal", style: DEFAULT_TEXT_STYLE }
          }
        } satisfies RemarksConfig
      }
    ]
  }
}
