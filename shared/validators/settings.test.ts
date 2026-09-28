import { describe, expect, it } from "vitest"

import { DEFAULT_REPORT_CARD_TEMPLATE } from "#shared/constants/kv-settings"

import {
  ReportCardTemplateSchema,
  ResultSettingsSchema,
  validateGradeBoundaryCoverage
} from "./settings"

const VALID = {
  gradeBoundaries: [
    { label: "A", min: 70, max: 100, remark: "Excellent" },
    { label: "B", min: 0, max: 69, remark: "Poor" }
  ],
  positionDisplayMode: "all" as const,
  positionTopN: 3,
  caCount: 3,
  caMaxScores: [10, 10, 10],
  examMax: 70
}

describe("ResultSettingsSchema", () => {
  it("accepts a valid score distribution", () => {
    expect(ResultSettingsSchema.safeParse(VALID).success).toBe(true)
  })

  it("rejects CA maxima + exam not summing to 100 (audit #7)", () => {
    expect(ResultSettingsSchema.safeParse({ ...VALID, examMax: 80 }).success).toBe(false)
  })

  it("rejects a caMaxScores length that does not match caCount", () => {
    expect(ResultSettingsSchema.safeParse({ ...VALID, caMaxScores: [10, 10] }).success).toBe(false)
  })
})

describe("ReportCardTemplateSchema", () => {
  it("accepts the default template", () => {
    expect(ReportCardTemplateSchema.safeParse(DEFAULT_REPORT_CARD_TEMPLATE).success).toBe(true)
  })

  it("rejects a subject column that is not always shown", () => {
    const invalid = {
      ...DEFAULT_REPORT_CARD_TEMPLATE,
      body: {
        columns: { ...DEFAULT_REPORT_CARD_TEMPLATE.body.columns, subject: false }
      }
    }

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a paragraph font size outside 10-24", () => {
    const invalid = {
      ...DEFAULT_REPORT_CARD_TEMPLATE,
      header: {
        ...DEFAULT_REPORT_CARD_TEMPLATE.header,
        paragraphs: [
          { id: "p", text: "Hi", fontSize: 40, color: "#000000", bold: false, align: "left" }
        ]
      }
    }

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a non-hex paragraph colour", () => {
    const invalid = {
      ...DEFAULT_REPORT_CARD_TEMPLATE,
      header: {
        ...DEFAULT_REPORT_CARD_TEMPLATE.header,
        paragraphs: [
          { id: "p", text: "Hi", fontSize: 14, color: "red", bold: false, align: "left" }
        ]
      }
    }

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects a watermark opacity above 1", () => {
    const invalid = {
      ...DEFAULT_REPORT_CARD_TEMPLATE,
      header: { ...DEFAULT_REPORT_CARD_TEMPLATE.header, watermarkOpacity: 1.5 }
    }

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })

  it("requires the info order to contain all four fields", () => {
    const invalid = {
      ...DEFAULT_REPORT_CARD_TEMPLATE,
      header: {
        ...DEFAULT_REPORT_CARD_TEMPLATE.header,
        info: {
          ...DEFAULT_REPORT_CARD_TEMPLATE.header.info,
          order: ["student", "class", "session"]
        }
      }
    }

    expect(ReportCardTemplateSchema.safeParse(invalid).success).toBe(false)
  })
})

describe("validateGradeBoundaryCoverage", () => {
  it("passes a gap-free scale covering 0-100", () => {
    expect(validateGradeBoundaryCoverage(VALID.gradeBoundaries)).toBeNull()
  })

  it("detects a gap", () => {
    const error = validateGradeBoundaryCoverage([
      { label: "A", min: 60, max: 100, remark: "A" },
      { label: "F", min: 0, max: 39, remark: "F" }
    ])
    expect(error).toMatch(/gap/i)
  })

  it("detects min greater than max", () => {
    const error = validateGradeBoundaryCoverage([{ label: "X", min: 80, max: 20, remark: "x" }])
    expect(error).toMatch(/greater than maximum/i)
  })

  it("detects an uncovered top end", () => {
    const error = validateGradeBoundaryCoverage([{ label: "F", min: 0, max: 50, remark: "f" }])
    expect(error).toMatch(/do not cover/i)
  })
})
