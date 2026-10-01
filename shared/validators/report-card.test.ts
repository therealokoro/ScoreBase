import { typeid } from "typeid-js"
import { describe, expect, it } from "vitest"

import {
  createDefaultPsychomotorConfig,
  createDefaultReportCardTemplate
} from "#shared/constants/report-card"

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
  config: { title: styled("Grading"), rows: [] }
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
        source: "custom",
        imageUrl: "report-card/watermark",
        opacity: 1.5,
        size: "medium",
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
        size: "medium",
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
        size: "medium",
        mode: "single"
      }
    })

    expect(ReportCardTemplateSchema.safeParse(valid).success).toBe(true)
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
          config: createDefaultPsychomotorConfig()
        }
      ]
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
      labelPlacement: "top",
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
      fields: [{ id: typeid("field").toString(), field: "bogus.field", label: "Bogus" }]
    }

    expect(StudentInfoConfigSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a column count outside 2-4", () => {
    const invalid = {
      columns: 5,
      borderStyle: "shaded-labels",
      labelPlacement: "top",
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
