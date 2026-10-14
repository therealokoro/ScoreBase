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

/** Font weights offered in the text-style controls (values are valid CSS font-weights). */
export const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Normal", value: "normal" },
  { label: "Medium", value: "500" },
  { label: "Semi-bold", value: "600" },
  { label: "Bold", value: "bold" },
  { label: "Extra bold", value: "800" }
] as const

export type FontWeight = (typeof FONT_WEIGHTS)[number]["value"]

export interface TextStyle {
  fontSize: number // px, 10–28
  fontWeight: FontWeight
  italic: boolean
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
  italic: false,
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
  /**
   * Where this block sits when the template's `footerLayout` is `"columns"`. Ignored for other
   * slots and for the `"stacked"` footer layout.
   */
  column: BlockColumn
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

/**
 * Footer flow. `"stacked"` (default) renders every footer block in one vertical column. `"columns"`
 * groups consecutive left/right blocks into a two-column row, so a grading key can sit bottom-left
 * while term info and signatures stack bottom-right.
 */
export type FooterLayout = "stacked" | "columns"

/** Column placement for a footer block under the `"columns"` footer layout. */
export type BlockColumn = "full" | "left" | "right"

/**
 * Rules shared by every table and grid on the card — the scores table, the student-info grid, the
 * grading key and custom tables. Set once on the template; blocks read them from CSS variables.
 */
export interface TableBorderSettings {
  /** Rule colour (hex). */
  color: string
  /** Inner rule thickness in px (0 hides them). */
  width: number
  /** Outer border thickness in px (0 hides it). */
  outlineWidth: number
}

export const DEFAULT_TABLE_BORDERS: TableBorderSettings = {
  // Black rules print like the paper report cards these templates reproduce.
  color: "#000000",
  width: 1,
  outlineWidth: 1
}

export interface ReportCardTemplate {
  id: string // typeid("template")
  /** Global font family for all report card text (blocks can override it). */
  fontFamily: string
  // Sidebar layout is derived: it kicks in whenever `sidebar` has blocks.
  sidebarPosition: SidebarPosition
  /** Footer flow - see `FooterLayout`. */
  footerLayout: FooterLayout
  /** Corner radius in px applied to the card's bordered boxes (0 = square, like a paper card). */
  borderRadius: number
  /** Rules for every table and grid on the card. */
  tableBorders: TableBorderSettings
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
  /** Free-form header text; the admin adds as many paragraphs as needed. */
  paragraphs: StyledText[]
  /** Renders the "GOVERNMENT APPROVED" badge in the header. */
  showGovernmentApprovedBadge: boolean
  /** Where the badge sits: 0 = straight after the school name, N = after the Nth paragraph. */
  badgeAfterParagraph: number
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
  /** Font size / weight for the values (labels stay small and muted). */
  valueFontSize: number
  valueFontWeight: FontWeight
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

export type ScoresCaDisplay =
  | "breakdown-grouped"
  | "breakdown-grouped-total"
  | "breakdown-single"
  | "summed"

export interface ScoresConfig {
  /**
   * One control that decides how the CA columns render: - "breakdown-grouped": a nested
   * "Assessments" group over the CA columns - "breakdown-single": each CA as its own column with
   * its own head - "summed": a single CA Total column
   */
  caDisplay: ScoresCaDisplay
  // Non-CA columns in display order; the CA columns (or CA Total) are inserted right after
  // "subject" based on `caDisplay`. CA ids are not allowed here.
  columns: ScoreColumnId[]
  /** Optional header overrides, keyed by column id. Missing entries use the built-in labels. */
  columnLabels: Record<string, string>
  /** Table text size in px (the heads scale with it). */
  fontSize: number
  /** Table text weight; the heads keep their own emphasis. */
  fontWeight: FontWeight
  /** One text colour for the whole table — headings and body cells alike (hex). */
  textColor: string
  /**
   * Shows each column's maximum in brackets under its heading ("Term Exam" over "(70)"), so every
   * head lines up. Off hides the brackets everywhere at once.
   */
  showScoreMax: boolean
}

// -- custom-table -----------------------------------------------------------

export type CustomTableVariant = "static" | "manual"

/** "stacked" = one row per label/value pair; "inline" = label/value pairs across a single row. */
export type CustomTableLayout = "stacked" | "inline"

export interface CustomTableRow {
  id: string // typeid("row")
  label: string
  value: string // only used when variant is "static"
  /**
   * Starts a new line when `layout` is `"inline"`, so several label/value pairs can share one
   * bordered table (e.g. the fee strip on line 1 and the next-term date on line 2).
   */
  newLine: boolean
}

export interface CustomTableConfig {
  variant: CustomTableVariant
  layout: CustomTableLayout
  title: StyledText
  rows: CustomTableRow[]
}

// -- grading-key ------------------------------------------------------------

export type GradingKeyDisplay = "grade" | "remark"

export type GradingKeyDisplayStyle = "list" | "table"

// Grade data always comes live from result settings' KV gradeBoundaries; the block only
// chooses how it renders and whether the grade or its remark is shown.
export interface GradingKeyConfig {
  title: StyledText
  display: GradingKeyDisplay
  /** "table" = two-column table; "list" = bulleted "A Distinction - 70% and above" lines. */
  displayStyle: GradingKeyDisplayStyle
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

/** How a remarks section arranges its signature and comment. */
/** A comment + signature section (e.g. the class teacher's remark). */
export interface RemarksSignatureConfig {
  visible: boolean
  label: StyledText // e.g. "Class Teacher's Comment:"
  showSignature: boolean
  signatureMode: SignatureMode
  signatureImage: string | null // NuxtHub Blob pathname
  signatureLabel: StyledText // e.g. "Class Teacher:"
}

/** A signature-only section (no comment), e.g. the head of the school. */
export interface RemarksSignatureOnlyConfig {
  visible: boolean
  showSignature: boolean
  signatureMode: SignatureMode
  signatureImage: string | null
  signatureLabel: StyledText
}

export interface RemarksConfig {
  teacher: RemarksSignatureConfig
  /**
   * The head signature. Principal and director are the same person — this is that one slot, and
   * `signatureLabel` names it per school ("Director:" for J.K., "Principal:" elsewhere).
   */
  director: RemarksSignatureOnlyConfig
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
    paragraphs: [],
    showGovernmentApprovedBadge: false,
    badgeAfterParagraph: 0
  }
}

export function createDefaultStudentInfoConfig(): StudentInfoConfig {
  return {
    columns: 3,
    borderStyle: "outlined",
    labelPlacement: "top",
    valueFontSize: 11,
    valueFontWeight: "600",
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
    caDisplay: "summed",
    columnLabels: {},
    columns: ["subject", "exam", "total", "grade", "remark"],
    fontSize: 12,
    fontWeight: "normal",
    textColor: "#000000",
    showScoreMax: true
  }
}

export function createDefaultCustomTableConfig(): CustomTableConfig {
  return {
    variant: "static",
    layout: "stacked",
    title: { value: "Custom Table", style: { ...DEFAULT_TEXT_STYLE, fontSize: 12 } },
    rows: [{ id: typeid("row").toString(), label: "Label", value: "", newLine: false }]
  }
}

/** Grade data comes live from result settings — the block only picks grade or remark. */
export function createDefaultGradingKeyConfig(): GradingKeyConfig {
  return {
    title: { value: "Grading Key", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } },
    display: "grade",
    displayStyle: "table"
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
      label: { value: "Class Teacher's Comment:", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } },
      showSignature: true,
      signatureMode: "blank",
      signatureImage: null,
      signatureLabel: { value: "Class Teacher:", style: { ...DEFAULT_TEXT_STYLE, fontSize: 10 } }
    },
    // The head signature (principal or director — name it in the builder).
    director: {
      visible: false,
      showSignature: true,
      signatureMode: "blank",
      signatureImage: null,
      signatureLabel: { value: "Director:", style: { ...DEFAULT_TEXT_STYLE, fontSize: 10 } }
    }
  }
}

// ---------------------------------------------------------------------------
// Default template
// ---------------------------------------------------------------------------

// Colours sampled from the school's own printed report card.
const JK_RED = "#CC0000" // school name
const JK_GREEN = "#80AE7F" // ministry / inspectorate lines
const JK_SLATE = "#5C697D" // descriptor, address, tel, PO box
const JK_MOTTO_RED = "#EF4444" // motto text

/** A `StyledText` with the default style plus overrides — keeps the template literal readable. */
function styledText(value: string, style: Partial<StyledText["style"]> = {}): StyledText {
  return { value, style: { ...DEFAULT_TEXT_STYLE, ...style } }
}

const CENTRED = { align: "center" } as const

/**
 * Builds the app's default report card template — the J.K. People's Comprehensive Academy card. A
 * fresh install, a reset, and the builder's loading placeholder all start from this, so the builder
 * opens on the school's real layout rather than an empty one.
 *
 * It is a function (not a constant) because `typeid()` must not hand the same ID to two blocks, and
 * because callers treat the result as an owned working copy. Every value is a default the admin can
 * change in the builder — nothing here is hard-coded in the renderers.
 */
export function createDefaultReportCardTemplate(): ReportCardTemplate {
  return {
    id: typeid("template").toString(),
    fontFamily: DEFAULT_FONT_FAMILY,
    sidebarPosition: "right",
    // Grading key bottom-left, term info + head signature bottom-right.
    footerLayout: "columns",
    // Square corners and black 1px rules, like the school's printed card.
    borderRadius: 0,
    tableBorders: { color: "#000000", width: 1, outlineWidth: 1 },
    watermark: null,

    header: [
      {
        id: typeid("block").toString(),
        type: "school-info",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          logoPlacement: "left-right",
          logoSize: "medium",
          // Upload the coat of arms (left) and the school crest (right) in the builder.
          logoPrimary: null,
          logoSecondary: null,
          schoolName: styledText("J.K. PEOPLE'S COMPREHENSIVE ACADEMY", {
            fontSize: 22,
            fontWeight: "bold",
            color: JK_RED,
            ...CENTRED
          }),
          // Free-form header lines, in printed order. The badge sits after the 3rd.
          paragraphs: [
            styledText("NASARAWA STATE MINISTRY OF EDUCATION", {
              fontSize: 13,
              fontWeight: "bold",
              color: JK_GREEN,
              ...CENTRED
            }),
            styledText("KARU EDUCATION INSPECTORATE AREA", {
              fontSize: 10,
              fontWeight: "bold",
              color: JK_GREEN,
              ...CENTRED
            }),
            styledText("(JUNIOR & SENIOR SECONDARY, SCIENCE & VOCATIONAL INSTITUTE)", {
              fontSize: 13,
              fontWeight: "bold",
              color: JK_SLATE,
              ...CENTRED
            }),
            styledText("Nyanya/Mararaba Boundary, New Karu L.G.A, Nasarawa State, Nigeria", {
              fontSize: 10,
              color: JK_SLATE,
              ...CENTRED
            }),
            styledText("Tel: 09-2903303, 08036466111, 08036458122, 08058046033", {
              fontSize: 10,
              color: JK_SLATE,
              ...CENTRED
            }),
            styledText("P.O.Box 477 Mararaba, Nasarawa State", {
              fontSize: 10,
              color: JK_SLATE,
              ...CENTRED
            }),
            styledText("MOTTO: Contentment Follows Enlightenment", {
              fontSize: 10,
              fontWeight: "bold",
              italic: true,
              color: JK_MOTTO_RED,
              ...CENTRED
            })
          ],
          showGovernmentApprovedBadge: true,
          badgeAfterParagraph: 3
        }
      }
    ],

    studentInfo: [
      {
        id: typeid("block").toString(),
        type: "student-info",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          columns: 4,
          // Per-cell grid lines, matching the paper original.
          borderStyle: "bordered",
          labelPlacement: "top",
          valueFontSize: 11,
          valueFontWeight: "bold",
          fields: [
            { id: typeid("field").toString(), field: "session.name", label: "Session:" },
            { id: typeid("field").toString(), field: "term.name", label: "Term:" },
            { id: typeid("field").toString(), field: "student.id", label: "Student ID:" },
            { id: typeid("field").toString(), field: "student.name", label: "Name:" },
            { id: typeid("field").toString(), field: "student.class", label: "Class:" },
            { id: typeid("field").toString(), field: "result.average", label: "Avg:" },
            { id: typeid("field").toString(), field: "class.size", label: "No. In Class:" },
            { id: typeid("field").toString(), field: "result.position", label: "Position:" }
          ]
        }
      }
    ],

    main: [
      {
        id: typeid("block").toString(),
        type: "scores",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          // CA breakdown grouped under "Assessments" plus a separate CA Total column.
          caDisplay: "breakdown-grouped-total",
          // CA columns are inserted after the subject automatically.
          columns: [
            "subject",
            "exam",
            "total",
            "grade",
            "classAverage",
            "subjectPosition",
            "remark"
          ],
          columnLabels: {
            subject: "Subjects",
            exam: "Term Exam",
            total: "Term Total",
            grade: "Term Grade",
            classAverage: "Class Avg.",
            subjectPosition: "Subject Position",
            remark: "Remarks"
          },
          // The maximums come from the result settings and print under each heading.
          fontSize: 12,
          fontWeight: "normal",
          textColor: "#000000",
          showScoreMax: true
        }
      }
    ],

    sidebar: [],

    footer: [
      {
        // One remarks block: the class teacher's row, with the head signature beneath it.
        id: typeid("block").toString(),
        type: "remarks",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          teacher: {
            visible: true,
            label: styledText("Class Teacher's Comment:", { fontSize: 11, fontWeight: "bold" }),
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: styledText("Class Teacher:", { fontSize: 11, fontWeight: "bold" })
          },
          // Principal and director are the same person; this school calls them the director.
          director: {
            visible: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: styledText("Director:", { fontSize: 11, fontWeight: "bold" })
          }
        }
      },
      {
        // Bottom-left.
        id: typeid("block").toString(),
        type: "grading-key",
        hidden: false,
        fontFamily: null,
        column: "left",
        config: {
          title: styledText("Grading Keys", { fontSize: 11, fontWeight: "bold" }),
          display: "grade",
          // Bulleted list ("● A Distinction - 70% and above") rather than a table.
          displayStyle: "list"
        }
      },
      {
        // Tuition / P.T.A / Total on the first line, the next-term date on the second — one table.
        id: typeid("block").toString(),
        type: "custom-table",
        hidden: false,
        fontFamily: null,
        column: "right",
        config: {
          variant: "static",
          layout: "inline",
          title: styledText(""),
          rows: [
            {
              id: typeid("row").toString(),
              label: "Tuition Fee",
              value: "N68,000",
              newLine: false
            },
            { id: typeid("row").toString(), label: "P.T.A", value: "N1,000", newLine: false },
            { id: typeid("row").toString(), label: "Total", value: "N69,000", newLine: false },
            {
              id: typeid("row").toString(),
              label: "Next Term Begins",
              value: "September 7, 2026",
              newLine: true
            }
          ]
        }
      }
    ]
  }
}
