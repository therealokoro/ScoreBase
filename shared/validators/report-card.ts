import { z } from "zod"

// ---------------------------------------------------------------------------
// Report Card Template — Zod schemas for the slot + block shape.
// Types live in shared/constants/report-card.ts; every block config interface
// has a matching named schema here (no z.any()).
// ---------------------------------------------------------------------------

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")

const TemplateIdSchema = z
  .string()
  .regex(/^template_[0-9a-hjkmnp-tv-z]{26}$/, "Must be a typeid with prefix 'template'")

const BlockIdSchema = z
  .string()
  .regex(/^block_[0-9a-hjkmnp-tv-z]{26}$/, "Must be a typeid with prefix 'block'")

const FieldIdSchema = z
  .string()
  .regex(/^field_[0-9a-hjkmnp-tv-z]{26}$/, "Must be a typeid with prefix 'field'")

const RowIdSchema = z
  .string()
  .regex(/^row_[0-9a-hjkmnp-tv-z]{26}$/, "Must be a typeid with prefix 'row'")

// ---------------------------------------------------------------------------
// Text styling
// ---------------------------------------------------------------------------

export const FONT_WEIGHTS = ["300", "normal", "500", "600", "bold", "800"] as const

export const TextStyleSchema = z.object({
  fontSize: z.number().int().min(8).max(28),
  fontWeight: z.enum(FONT_WEIGHTS),
  italic: z.boolean().default(false),
  color: HexColorSchema,
  align: z.enum(["left", "center", "right"])
})

export type TextStyle = z.infer<typeof TextStyleSchema>

export const StyledTextSchema = z.object({
  value: z.string(),
  style: TextStyleSchema
})

export type StyledText = z.infer<typeof StyledTextSchema>

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

export const WatermarkSchema = z
  .object({
    source: z.enum(["logo", "custom"]),
    imageUrl: z.string().nullable(),
    opacity: z.number().min(0).max(1),
    size: z.enum(["small", "medium", "large"]),
    mode: z.enum(["single", "tiled"])
  })
  .refine((watermark) => watermark.source !== "custom" || watermark.imageUrl !== null, {
    message: "A custom watermark needs an uploaded image",
    path: ["imageUrl"]
  })

export type Watermark = z.infer<typeof WatermarkSchema>

/** Whether a labelled value shows its label above the value or beside it. */
export const LabelPlacementSchema = z.enum(["top", "side"])

// ---------------------------------------------------------------------------
// Block configs
// ---------------------------------------------------------------------------

// -- school-info -----------------------------------------------------------

export const SchoolInfoConfigSchema = z.object({
  logoPlacement: z.enum(["left", "center", "right", "left-right"]),
  logoSize: z.enum(["small", "medium", "large"]),
  logoPrimary: z.string().nullable(),
  logoSecondary: z.string().nullable(),
  schoolName: StyledTextSchema,
  paragraphs: z.array(StyledTextSchema),
  // Defaults keep templates saved before these fields existed loading cleanly.
  showGovernmentApprovedBadge: z.boolean().default(false),
  badgeAfterParagraph: z.number().int().min(0).default(0)
})

export type SchoolInfoConfig = z.infer<typeof SchoolInfoConfigSchema>

// -- student-info ----------------------------------------------------------

export const STUDENT_INFO_FIELDS = [
  "student.name",
  "student.id",
  "student.class",
  "class.size",
  "term.name",
  "session.name",
  "result.average",
  "result.position"
] as const

export const StudentInfoFieldSchema = z.enum(STUDENT_INFO_FIELDS)
export type StudentInfoField = z.infer<typeof StudentInfoFieldSchema>

export const StudentInfoFieldRowSchema = z.object({
  id: FieldIdSchema,
  field: StudentInfoFieldSchema,
  label: z.string().min(1)
})

export type StudentInfoFieldRow = z.infer<typeof StudentInfoFieldRowSchema>

export const StudentInfoConfigSchema = z.object({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  borderStyle: z.enum(["outlined", "borderless", "bordered"]),
  // Defaulted so templates saved before the setting existed still validate.
  borderWidth: z.number().int().min(0).max(4).default(1),
  labelPlacement: LabelPlacementSchema,
  valueFontSize: z.number().int().min(8).max(20),
  valueFontWeight: z.enum(FONT_WEIGHTS),
  fields: z.array(StudentInfoFieldRowSchema)
})

export type StudentInfoConfig = z.infer<typeof StudentInfoConfigSchema>

// -- scores ----------------------------------------------------------------

// The CA columns are dynamic — one per CA slot up to scoreConfig.caCount. The schema accepts
// any `ca<number>` id (the renderer clamps to caCount at read time); `min(1)` keeps the slot
// 1-based, matching caScores array indexing.
const CaColumnSchema = z.templateLiteral(["ca", z.number().int().min(1)])

const FixedScoreColumnSchema = z.enum([
  "subject",
  "caTotal",
  "exam",
  "total",
  "classHighest",
  "classLowest",
  "classAverage",
  "grade",
  "remark",
  "subjectPosition"
])

export const ScoreColumnIdSchema = z.union([FixedScoreColumnSchema, CaColumnSchema])
export type ScoreColumnId = z.infer<typeof ScoreColumnIdSchema>

export const ScoresConfigSchema = z
  .object({
    caDisplay: z.enum([
      "breakdown-grouped",
      "breakdown-grouped-total",
      "breakdown-single",
      "summed"
    ]),
    columns: z.array(ScoreColumnIdSchema),
    // Header overrides; missing entries fall back to the built-in labels.
    columnLabels: z.record(z.string(), z.string()).default({}),
    // Defaulted so templates saved before these existed still validate.
    fontSize: z.number().int().min(8).max(20).default(12),
    fontWeight: z.enum(FONT_WEIGHTS).default("normal"),
    borderWidth: z.number().int().min(0).max(4).default(1),
    showScoreMax: z.boolean().default(true)
  })
  .refine((config) => config.columns[0] === "subject", {
    message: "The subject column must come first",
    path: ["columns"]
  })
  .refine(
    (config) => !config.columns.some((column) => /^ca\d+$/.test(column) || column === "caTotal"),
    { message: "CA columns are controlled by caDisplay", path: ["columns"] }
  )

export type ScoresConfig = z.infer<typeof ScoresConfigSchema>

// -- custom-table ----------------------------------------------------------

export const CustomTableRowSchema = z.object({
  id: RowIdSchema,
  label: z.string().min(1),
  value: z.string(),
  // Starts a new line in the inline layout; defaulted for older saved rows.
  newLine: z.boolean().default(false)
})

export type CustomTableRow = z.infer<typeof CustomTableRowSchema>

export const CustomTableConfigSchema = z.object({
  variant: z.enum(["static", "manual"]),
  layout: z.enum(["stacked", "inline"]).default("stacked"),
  title: StyledTextSchema,
  rows: z.array(CustomTableRowSchema)
})

export type CustomTableConfig = z.infer<typeof CustomTableConfigSchema>

// -- grading-key -----------------------------------------------------------

export const GradingKeyConfigSchema = z.object({
  title: StyledTextSchema,
  display: z.enum(["grade", "remark"]),
  displayStyle: z.enum(["list", "table"]).default("table")
})

export type GradingKeyConfig = z.infer<typeof GradingKeyConfigSchema>

// -- psychomotor -----------------------------------------------------------

export const PsychomotorRowSchema = z.object({
  id: RowIdSchema,
  label: z.string().min(1)
})

export type PsychomotorRow = z.infer<typeof PsychomotorRowSchema>

export const PsychomotorConfigSchema = z.object({
  title: StyledTextSchema,
  rows: z.array(PsychomotorRowSchema)
})

export type PsychomotorConfig = z.infer<typeof PsychomotorConfigSchema>

// -- summary ---------------------------------------------------------------

export const SummaryMetricSchema = z.enum([
  "marksObtainable",
  "marksObtained",
  "subjectsOffered",
  "average",
  "position",
  "positionOutOf"
])

export type SummaryMetric = z.infer<typeof SummaryMetricSchema>

export const SummaryConfigSchema = z.object({
  metrics: z.array(SummaryMetricSchema),
  style: z.enum(["inline", "grid"]),
  labelPlacement: LabelPlacementSchema
})

export type SummaryConfig = z.infer<typeof SummaryConfigSchema>

// -- remarks ---------------------------------------------------------------

export const RemarksSignatureConfigSchema = z.object({
  visible: z.boolean(),
  label: StyledTextSchema,
  commentLabelPlacement: LabelPlacementSchema,
  layout: z.enum(["stacked", "signature-comment"]).default("stacked"),
  showSignature: z.boolean(),
  signatureMode: z.enum(["blank", "image"]),
  signatureImage: z.string().nullable(),
  signatureLabel: StyledTextSchema
})

export type RemarksSignatureConfig = z.infer<typeof RemarksSignatureConfigSchema>

export const RemarksSignatureOnlyConfigSchema = z.object({
  visible: z.boolean(),
  showSignature: z.boolean(),
  signatureMode: z.enum(["blank", "image"]),
  signatureImage: z.string().nullable(),
  signatureLabel: StyledTextSchema
})

export type RemarksSignatureOnlyConfig = z.infer<typeof RemarksSignatureOnlyConfigSchema>

const DEFAULT_DIRECTOR_CONFIG = {
  visible: false,
  showSignature: true,
  signatureMode: "blank" as const,
  signatureImage: null,
  signatureLabel: {
    value: "Director",
    style: {
      fontSize: 10,
      fontWeight: "normal" as const,
      italic: false,
      color: "#000000",
      align: "left" as const
    }
  }
}

export const RemarksConfigSchema = z.object({
  teacher: RemarksSignatureConfigSchema,
  principal: RemarksSignatureConfigSchema,
  // Defaulted so templates saved before the director existed still validate.
  director: RemarksSignatureOnlyConfigSchema.default(DEFAULT_DIRECTOR_CONFIG)
})

export type RemarksConfig = z.infer<typeof RemarksConfigSchema>

// ---------------------------------------------------------------------------
// Blocks — discriminated union on `type`
// ---------------------------------------------------------------------------

const BlockBaseSchema = z.object({
  id: BlockIdSchema,
  hidden: z.boolean(),
  // Optional per-block font override; null inherits the template's font family. Defaulted so
  // templates saved before this field existed still validate.
  fontFamily: z.string().nullable().default(null),
  // Footer column placement; defaulted for the same backward-compatibility reason.
  column: z.enum(["full", "left", "right"]).default("full")
})

export const SchoolInfoBlockSchema = BlockBaseSchema.extend({
  type: z.literal("school-info"),
  config: SchoolInfoConfigSchema
})

export const StudentInfoBlockSchema = BlockBaseSchema.extend({
  type: z.literal("student-info"),
  config: StudentInfoConfigSchema
})

export const ScoresBlockSchema = BlockBaseSchema.extend({
  type: z.literal("scores"),
  config: ScoresConfigSchema
})

export const CustomTableBlockSchema = BlockBaseSchema.extend({
  type: z.literal("custom-table"),
  config: CustomTableConfigSchema
})

export const GradingKeyBlockSchema = BlockBaseSchema.extend({
  type: z.literal("grading-key"),
  config: GradingKeyConfigSchema
})

export const PsychomotorBlockSchema = BlockBaseSchema.extend({
  type: z.literal("psychomotor"),
  config: PsychomotorConfigSchema
})

export const SummaryBlockSchema = BlockBaseSchema.extend({
  type: z.literal("summary"),
  config: SummaryConfigSchema
})

export const RemarksBlockSchema = BlockBaseSchema.extend({
  type: z.literal("remarks"),
  config: RemarksConfigSchema
})

export const ReportCardBlockSchema = z.discriminatedUnion("type", [
  SchoolInfoBlockSchema,
  StudentInfoBlockSchema,
  ScoresBlockSchema,
  CustomTableBlockSchema,
  GradingKeyBlockSchema,
  PsychomotorBlockSchema,
  SummaryBlockSchema,
  RemarksBlockSchema
])

export type ReportCardBlock = z.infer<typeof ReportCardBlockSchema>

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export const ReportCardTemplateSchema = z.object({
  id: TemplateIdSchema,
  fontFamily: z.string().min(1),
  sidebarPosition: z.enum(["left", "right"]),
  // Defaulted so templates saved before the two-column footer existed still validate.
  footerLayout: z.enum(["stacked", "columns"]).default("stacked"),
  borderRadius: z.number().int().min(0).max(24).default(8),
  watermark: WatermarkSchema.nullable(),
  header: z.array(ReportCardBlockSchema),
  studentInfo: z.array(ReportCardBlockSchema),
  main: z.array(ReportCardBlockSchema),
  sidebar: z.array(ReportCardBlockSchema),
  footer: z.array(ReportCardBlockSchema)
})

export type ReportCardTemplateType = z.infer<typeof ReportCardTemplateSchema>

// ---------------------------------------------------------------------------
// Manual values (stored per scoresheet row — validated on write)
// ---------------------------------------------------------------------------

export const ManualValuesSchema = z.record(z.string(), z.record(z.string(), z.string()))

export type ManualValues = z.infer<typeof ManualValuesSchema>
