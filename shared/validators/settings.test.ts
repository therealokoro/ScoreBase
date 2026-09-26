import { describe, expect, it } from "vitest"

import { ResultSettingsSchema, validateGradeBoundaryCoverage } from "./settings"

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
