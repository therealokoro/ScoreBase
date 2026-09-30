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

export const TextStyleSchema = z.object({
  fontSize: z.number().int().min(10).max(28),
  fontWeight: z.enum(["normal", "bold"]),
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

export const WatermarkSchema = z.object({
  imageUrl: z.string().min(1),
  opacity: z.number().min(0).max(1),
  size: z.enum(["small", "medium", "large"]),
  mode: z.enum(["single", "tiled"])
})

export type Watermark = z.infer<typeof WatermarkSchema>

// ---------------------------------------------------------------------------
// Block configs
// ---------------------------------------------------------------------------

// -- school-info -----------------------------------------------------------

export const SchoolInfoConfigSchema = z.object({
  logoPlacement: z.enum(["left", "center", "right", "left-right"]),
  logoPrimary: z.string().nullable(),
  logoSecondary: z.string().nullable(),
  schoolName: StyledTextSchema,
  address: StyledTextSchema,
  motto: StyledTextSchema,
  extraText: StyledTextSchema
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
  "result.position",
  "result.positionOutOf"
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
  borderStyle: z.enum(["outlined", "borderless", "shaded-labels"]),
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
    caMode: z.enum(["breakdown", "summed"]),
    columns: z.array(ScoreColumnIdSchema)
  })
  .refine((config) => config.columns[0] === "subject", {
    message: "The subject column must come first",
    path: ["columns"]
  })

export type ScoresConfig = z.infer<typeof ScoresConfigSchema>

// -- custom-table ----------------------------------------------------------

export const CustomTableRowSchema = z.object({
  id: RowIdSchema,
  label: z.string().min(1),
  value: z.string()
})

export type CustomTableRow = z.infer<typeof CustomTableRowSchema>

export const CustomTableConfigSchema = z.object({
  variant: z.enum(["static", "manual"]),
  title: StyledTextSchema,
  rows: z.array(CustomTableRowSchema)
})

export type CustomTableConfig = z.infer<typeof CustomTableConfigSchema>

// -- grading-key -----------------------------------------------------------

export const GradingKeyConfigSchema = z.object({
  title: StyledTextSchema
})

export type GradingKeyConfig = z.infer<typeof GradingKeyConfigSchema>

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
  style: z.enum(["inline", "grid"])
})

export type SummaryConfig = z.infer<typeof SummaryConfigSchema>

// -- remarks ---------------------------------------------------------------

export const RemarksSignatureConfigSchema = z.object({
  visible: z.boolean(),
  label: StyledTextSchema,
  showComment: z.boolean(),
  showSignature: z.boolean(),
  signatureMode: z.enum(["blank", "image"]),
  signatureImage: z.string().nullable(),
  signatureLabel: StyledTextSchema
})

export type RemarksSignatureConfig = z.infer<typeof RemarksSignatureConfigSchema>

export const RemarksConfigSchema = z.object({
  teacher: RemarksSignatureConfigSchema,
  principal: RemarksSignatureConfigSchema
})

export type RemarksConfig = z.infer<typeof RemarksConfigSchema>

// ---------------------------------------------------------------------------
// Blocks — discriminated union on `type`
// ---------------------------------------------------------------------------

const BlockBaseSchema = z.object({
  id: BlockIdSchema,
  hidden: z.boolean()
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
  SummaryBlockSchema,
  RemarksBlockSchema
])

export type ReportCardBlock = z.infer<typeof ReportCardBlockSchema>

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export const ReportCardTemplateSchema = z
  .object({
    id: TemplateIdSchema,
    name: z.string().min(1).max(120),
    layout: z.enum(["full", "sidebar"]),
    sidebarPosition: z.enum(["left", "right"]).nullable(),
    watermark: WatermarkSchema.nullable(),
    header: z.array(ReportCardBlockSchema),
    studentInfo: z.array(ReportCardBlockSchema),
    main: z.array(ReportCardBlockSchema),
    sidebar: z.array(ReportCardBlockSchema),
    footer: z.array(ReportCardBlockSchema)
  })
  .superRefine((template, ctx) => {
    if (template.layout === "full" && template.sidebarPosition !== null) {
      ctx.addIssue({
        code: "custom",
        message: "sidebarPosition must be null when layout is full",
        path: ["sidebarPosition"]
      })
    }
    if (template.layout === "sidebar" && template.sidebarPosition === null) {
      ctx.addIssue({
        code: "custom",
        message: "sidebarPosition is required when layout is sidebar",
        path: ["sidebarPosition"]
      })
    }
    if (template.layout === "full" && template.sidebar.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "sidebar blocks are not allowed when layout is full",
        path: ["sidebar"]
      })
    }
  })

export type ReportCardTemplateType = z.infer<typeof ReportCardTemplateSchema>

// ---------------------------------------------------------------------------
// Manual values (stored per scoresheet row — validated on write)
// ---------------------------------------------------------------------------

export const ManualValuesSchema = z.record(z.string(), z.record(z.string(), z.string()))

export type ManualValues = z.infer<typeof ManualValuesSchema>
