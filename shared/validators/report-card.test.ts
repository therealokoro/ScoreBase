import { typeid } from "typeid-js"
import { describe, expect, it } from "vitest"

import { createDefaultReportCardTemplate } from "#shared/constants/report-card"

import {
  ReportCardTemplateSchema,
  ScoresConfigSchema,
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
  config: { title: styled("Grading") }
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
          config: {
            logoPlacement: "left",
            logoPrimary: null,
            logoSecondary: null,
            schoolName: {
              value: "Hi",
              style: { fontSize: 40, fontWeight: "bold", color: "#000000", align: "left" }
            },
            address: {
              value: "",
              style: { fontSize: 12, fontWeight: "normal", color: "#000000", align: "left" }
            },
            motto: {
              value: "",
              style: { fontSize: 12, fontWeight: "normal", color: "#000000", align: "left" }
            },
            extraText: {
              value: "",
              style: { fontSize: 11, fontWeight: "normal", color: "#000000", align: "left" }
            }
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
        imageUrl: "report-card/logo-primary",
        opacity: 1.5,
        size: "medium",
        mode: "single"
      }
    })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a template name that is empty or over 120 characters", () => {
    expect(ReportCardTemplateSchema.safeParse(templateWith({ name: "" })).success).toBe(false)
    expect(
      ReportCardTemplateSchema.safeParse(templateWith({ name: "x".repeat(121) })).success
    ).toBe(false)
  })

  it("requires sidebarPosition to be null when layout is full", () => {
    const invalid = templateWith({ sidebarPosition: "left" })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("requires a sidebarPosition when layout is sidebar", () => {
    const invalid = templateWith({ layout: "sidebar" })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects sidebar blocks when layout is full", () => {
    const invalid = templateWith({ sidebar: [gradingKeyBlock()] })

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("accepts a sidebar layout with blocks in the sidebar", () => {
    const valid = templateWith({
      layout: "sidebar",
      sidebarPosition: "right",
      sidebar: [gradingKeyBlock()]
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
  })
})

describe("ScoresConfigSchema", () => {
  it("accepts CA breakdown and summed together with dynamic CA columns", () => {
    const valid = {
      caMode: "breakdown",
      columns: ["subject", "ca1", "ca2", "ca3", "caTotal", "exam", "total", "grade", "remark"]
    }

    expect(ScoresConfigSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects a CA column that is not a number-indexed id", () => {
    const invalid = { caMode: "summed", columns: ["subject", "caX"] }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("requires the subject column to come first", () => {
    const invalid = { caMode: "summed", columns: ["caTotal", "subject"] }

    expect(ScoresConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects an empty column list", () => {
    const invalid = { caMode: "summed", columns: [] }

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
      fields: [{ id: typeid("field").toString(), field: "bogus.field", label: "Bogus" }]
    }

    expect(StudentInfoConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a column count outside 2-4", () => {
    const invalid = {
      columns: 5,
      borderStyle: "shaded-labels",
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
