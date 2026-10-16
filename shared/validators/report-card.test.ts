import { typeid } from "typeid-js"
import { describe, expect, it } from "vitest"

import {
  createDefaultPsychomotorConfig,
  createDefaultReportCardTemplate
} from "#shared/constants/report-card"

import {
  ReportCardTemplateSchema,
  ScoresConfigSchema,
  CustomTableConfigSchema,
  CustomTableRowSchema,
  GradingKeyConfigSchema,
  RemarksConfigSchema,
  ReportCardBlockSchema,
  StyledTextSchema,
  StudentInfoConfigSchema
} from "./report-card"

const styled = (value: string) => ({
  value,
  style: { fontSize: 14, fontWeight: "normal" as const, color: "#000000", align: "left" as const }
})

const gradingKeyBlock = () => ({
  id: typeid("block").toString(),
  type: "grading-key",
  hidden: false,
  fontFamily: null,
  config: { title: styled("Grading"), display: "grade" }
})

const templateWith = (overrides: Record<string, unknown>) => ({
  ...createDefaultReportCardTemplate(),
  ...overrides
})

describe("ReportCardTemplateSchema", () => {
  it("accepts the default template", () => {
    expect(ReportCardTemplateSchema.safeParse(createDefaultReportCardTemplate()).success).toBe(true)
  })

  it("rejects an unknown block type", () => {
    const invalid = templateWith({
      main: [{ id: typeid("block").toString(), type: "bogus", hidden: false, config: {} }]
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a fontSize outside 10-28", () => {
    const invalid = templateWith({
      header: [
        {
          id: typeid("block").toString(),
          type: "school-info",
          hidden: false,
          fontFamily: null,
          config: {
            logoPlacement: "left",
            logoSize: "medium",
            logoPrimary: null,
            logoSecondary: null,
            schoolName: {
              value: "Hi",
              style: { fontSize: 40, fontWeight: "bold", color: "#000000", align: "left" }
            },
            paragraphs: [],
            showGovernmentApprovedBadge: false,
            badgeAfterParagraph: 0
          }
        }
      ]
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a non-hex colour", () => {
    const invalid = StyledTextSchema.safeParse({
      value: "Hi",
      style: { fontSize: 14, fontWeight: "normal", color: "red", align: "left" }
    })

    expect(invalid.success).toBe(false)
  })

  it("rejects a watermark opacity above 1", () => {
    const invalid = templateWith({
      watermark: {
        source: "custom",
        imageUrl: "report-card/watermark",
        opacity: 1.5,
        size: 350,
        mode: "single"
      }
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a custom watermark without an uploaded image", () => {
    const invalid = templateWith({
      watermark: {
        source: "custom",
        imageUrl: null,
        opacity: 0.1,
        size: 350,
        mode: "single"
      }
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("accepts a logo watermark with no uploaded image", () => {
    const valid = templateWith({
      watermark: {
        source: "logo",
        imageUrl: null,
        opacity: 0.08,
        size: 350,
        mode: "single"
      }
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
  })

  it("reads the old small/medium/large watermark sizes back as px", () => {
    const legacy = (size: string) =>
      templateWith({
        watermark: { source: "logo", imageUrl: null, opacity: 0.08, size, mode: "single" }
      })

    const sizes = ["small", "medium", "large"].map((size) => {
      const parsed = ReportCardTemplateSchema.safeParse(legacy(size))
      return parsed.success ? parsed.data.watermark?.size : null
    })

    expect(sizes).toEqual([200, 350, 500])
  })

  it("rejects a watermark size outside the slider's range", () => {
    const tooBig = templateWith({
      watermark: { source: "logo", imageUrl: null, opacity: 0.08, size: 900, mode: "single" }
    })

    expect(ReportCardTemplateSchema.safeParse(tooBig).success).toBe(false)
  })

  it("accepts sidebar blocks (the sidebar layout is derived from them)", () => {
    const valid = templateWith({
      sidebarPosition: "right",
      sidebar: [gradingKeyBlock()]
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts a psychomotor block only in the sidebar slot shape", () => {
    const valid = templateWith({
      sidebar: [
        {
          id: typeid("block").toString(),
          type: "psychomotor",
          hidden: false,
          fontFamily: null,
          config: createDefaultPsychomotorConfig()
        }
      ]
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts the school-info badge fields", () => {
    const valid = templateWith({
      header: [
        {
          id: typeid("block").toString(),
          type: "school-info",
          hidden: false,
          fontFamily: null,
          config: {
            logoPlacement: "left-right",
            logoSize: "medium",
            logoPrimary: null,
            logoSecondary: null,
            schoolName: {
              value: "J.K. PEOPLE'S COMPREHENSIVE ACADEMY",
              style: { fontSize: 22, fontWeight: "bold", color: "#CC0000", align: "center" }
            },
            paragraphs: [
              {
                value: "NASARAWA STATE MINISTRY OF EDUCATION",
                style: { fontSize: 13, fontWeight: "bold", color: "#CC0000", align: "center" }
              }
            ],
            showGovernmentApprovedBadge: true,
            badgeAfterParagraph: 1
          }
        }
      ]
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects a negative badge position", () => {
    const invalid = templateWith({
      header: [
        {
          id: typeid("block").toString(),
          type: "school-info",
          hidden: false,
          fontFamily: null,
          config: {
            logoPlacement: "left",
            logoSize: "medium",
            logoPrimary: null,
            logoSecondary: null,
            schoolName: {
              value: "School",
              style: { fontSize: 16, fontWeight: "bold", color: "#000000", align: "center" }
            },
            paragraphs: [],
            showGovernmentApprovedBadge: true,
            badgeAfterParagraph: -1
          }
        }
      ]
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })
})

describe("ScoresConfigSchema", () => {
  it("accepts the four CA display modes with non-CA columns", () => {
    for (const caDisplay of [
      "breakdown-grouped",
      "breakdown-grouped-total",
      "breakdown-single",
      "summed"
    ] as const) {
      const valid = {
        caDisplay,
        columns: ["subject", "exam", "total", "grade", "remark"]
      }

      expect(ScoresConfigSchema.safeParse(valid).success).toBe(true)
    }
  })

  it("rejects CA columns in the column list (they are driven by caDisplay)", () => {
    const invalid = {
      caDisplay: "breakdown-single",
      columns: ["subject", "ca1", "exam"]
    }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("accepts and preserves custom column headings", () => {
    const parsed = ScoresConfigSchema.safeParse({
      caDisplay: "breakdown-grouped-total",
      columns: ["subject", "exam", "total"],
      columnLabels: { subject: "Subjects", exam: "Term Exam (70)" }
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.columnLabels.exam).toBe("Term Exam (70)")
  })

  it("rejects a CA column that is not a number-indexed id", () => {
    const invalid = { caDisplay: "summed", columns: ["subject", "caX"] }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("requires the subject column to come first", () => {
    const invalid = { caDisplay: "summed", columns: ["exam", "subject"] }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects an empty column list", () => {
    const invalid = { caDisplay: "summed", columns: [] }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("accepts the default scores config used by the template factory", () => {
    const template = createDefaultReportCardTemplate()
    const block = template.main[0]

    expect(block?.type).toBe("scores")
    expect(ScoresConfigSchema.safeParse((block as { config: unknown }).config).success).toBe(true)
  })
})

describe("StudentInfoConfigSchema", () => {
  it("accepts a 3-column outlined config with typed fields", () => {
    const valid = {
      columns: 3,
      borderStyle: "outlined",
      labelPlacement: "top",
      valueFontSize: 11,
      valueFontWeight: "600",
      fields: [
        { id: typeid("field").toString(), field: "student.name", label: "Student Name" },
        { id: typeid("field").toString(), field: "class.size", label: "Class Size" }
      ]
    }

    expect(StudentInfoConfigSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects an unknown field", () => {
    const invalid = {
      columns: 2,
      borderStyle: "borderless",
      labelPlacement: "top",
      valueFontSize: 11,
      valueFontWeight: "600",
      fields: [{ id: typeid("field").toString(), field: "bogus.field", label: "Bogus" }]
    }

    expect(StudentInfoConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a column count outside 2-4", () => {
    const invalid = {
      columns: 5,
      borderStyle: "bordered",
      labelPlacement: "top",
      valueFontSize: 11,
      valueFontWeight: "600",
      fields: [{ id: typeid("field").toString(), field: "term.name", label: "Term" }]
    }

    expect(StudentInfoConfigSchema.safeParse(invalid).success).toBe(false)
  })
})

describe("createDefaultReportCardTemplate", () => {
  it("generates fresh ids on every call", () => {
    const a = createDefaultReportCardTemplate()
    const b = createDefaultReportCardTemplate()

    expect(a.id).not.toBe(b.id)
    expect(a.header[0]?.id).not.toBe(b.header[0]?.id)
    expect(a.footer[1]?.id).not.toBe(b.footer[1]?.id)
  })
})

// Templates saved before these fields existed must keep loading: block arrays are replaced
// wholesale on read, so the schema (not the merge) has to supply the defaults.
describe("backward compatibility defaults", () => {
  const styled = (value: string) => ({
    value,
    style: { fontSize: 14, fontWeight: "normal" as const, color: "#000000", align: "left" as const }
  })

  it("fills in a missing block fontFamily", () => {
    const parsed = ReportCardBlockSchema.safeParse({
      id: typeid("block").toString(),
      type: "summary",
      hidden: false,
      config: { metrics: ["average"], style: "inline", labelPlacement: "top" }
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.fontFamily).toBe(null)
  })

  it("fills in a missing block column", () => {
    const parsed = ReportCardBlockSchema.safeParse({
      id: typeid("block").toString(),
      type: "summary",
      hidden: false,
      fontFamily: null,
      config: { metrics: ["average"], style: "inline", labelPlacement: "top" }
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.column).toBe("full")
  })

  it("fills in a missing footer layout", () => {
    const template = createDefaultReportCardTemplate()
    const { footerLayout, ...withoutFooterLayout } = template

    // The default template uses the two-column footer; a template saved without the field
    // still falls back to the older stacked flow.
    expect(footerLayout).toBe("columns")
    const parsed = ReportCardTemplateSchema.safeParse(withoutFooterLayout)
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.footerLayout).toBe("stacked")
  })

  it("fills in a missing border radius", () => {
    const template = createDefaultReportCardTemplate()
    const { borderRadius, ...withoutRadius } = template

    // The default card is square; a template saved without the field keeps the 8px fallback.
    expect(borderRadius).toBe(0)
    const parsed = ReportCardTemplateSchema.safeParse(withoutRadius)
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.borderRadius).toBe(8)
  })

  it("fills in the missing scores text settings and the maximum switch", () => {
    const parsed = ScoresConfigSchema.safeParse({
      caDisplay: "summed",
      columns: ["subject", "total"]
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.fontSize).toBe(12)
    expect(parsed.success && parsed.data.fontWeight).toBe("normal")
    expect(parsed.success && parsed.data.textColor).toBe("#000000")
    expect(parsed.success && parsed.data.showScoreMax).toBe(true)
  })

  it("fills in the missing table border settings", () => {
    const template = createDefaultReportCardTemplate()
    const { tableBorders, ...withoutBorders } = template

    expect(tableBorders).toEqual({ color: "#000000", width: 1, outlineWidth: 1 })
    const parsed = ReportCardTemplateSchema.safeParse(withoutBorders)
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.tableBorders).toEqual(tableBorders)
  })

  it("fills in a missing custom-table row line break", () => {
    const parsed = CustomTableRowSchema.safeParse({
      id: typeid("row").toString(),
      label: "Tuition Fee",
      value: "N68,000"
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.newLine).toBe(false)
  })

  it("fills in a missing grading-key displayStyle", () => {
    const parsed = GradingKeyConfigSchema.safeParse({
      title: styled("Grading Keys"),
      display: "grade"
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.displayStyle).toBe("table")
  })

  it("fills in a missing custom-table layout", () => {
    const parsed = CustomTableConfigSchema.safeParse({
      variant: "static",
      title: styled(""),
      rows: []
    })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.layout).toBe("stacked")
  })

  it("fills in a missing head signature and drops a legacy principal section", () => {
    const teacher = {
      visible: true,
      label: styled("Remark"),
      showSignature: true,
      signatureMode: "blank",
      signatureImage: null,
      signatureLabel: styled("Teacher")
    }

    // principal predates the merge into one head slot; it is ignored, not carried over.
    const parsed = RemarksConfigSchema.safeParse({ teacher, principal: teacher })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.director.visible).toBe(false)
    expect(parsed.success && "principal" in parsed.data).toBe(false)
  })
})
