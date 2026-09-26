import { describe, expect, it } from "vitest"

import { computeReportCard, formatPosition, getGradeBoundary, toOrdinal } from "./report-card"
import type { ScoresheetInput } from "./report-card"
import type { GradeBoundary } from "../validators/settings"

const BOUNDARIES: GradeBoundary[] = [
  { label: "A", min: 70, max: 100, remark: "Excellent" },
  { label: "B", min: 60, max: 69, remark: "Very Good" },
  { label: "C", min: 50, max: 59, remark: "Good" },
  { label: "D", min: 40, max: 49, remark: "Pass" },
  { label: "F", min: 0, max: 39, remark: "Fail" }
]

const SCORE_CONFIG = { caCount: 2, caMaxScores: [20, 20], examMax: 60 }

function sheet(
  id: string,
  name: string,
  caScores: (number | null)[],
  exam: number | null
): ScoresheetInput {
  return {
    scoresheetId: id,
    studentId: `stu-${id}`,
    studentName: name,
    studentSchoolId: `ID-${id}`,
    subjectScores: [{ id: `ss-${id}`, subjectName: "Maths", caScores, exam }]
  }
}

describe("getGradeBoundary", () => {
  it("matches the containing boundary", () => {
    expect(getGradeBoundary(72, BOUNDARIES)?.label).toBe("A")
    expect(getGradeBoundary(39, BOUNDARIES)?.label).toBe("F")
  })

  it("never returns undefined for a populated scale, even outside the range", () => {
    expect(getGradeBoundary(150, BOUNDARIES)?.label).toBe("A")
    expect(getGradeBoundary(-5, BOUNDARIES)?.label).toBe("F")
  })

  it("falls back to the nearest boundary below a gap (audit #15)", () => {
    const gapped: GradeBoundary[] = [
      { label: "A", min: 80, max: 100, remark: "Excellent" },
      { label: "C", min: 0, max: 49, remark: "Good" } // 50-79 intentionally missing
    ]
    expect(getGradeBoundary(60, gapped)?.label).toBe("C")
    expect(getGradeBoundary(20, gapped)?.label).toBe("C")
  })

  it("returns undefined only when there are no boundaries", () => {
    expect(getGradeBoundary(50, [])).toBeUndefined()
  })
})

describe("toOrdinal", () => {
  it("handles 1-3, the 11-13 exception, and the rest", () => {
    expect(toOrdinal(1)).toBe("1st")
    expect(toOrdinal(2)).toBe("2nd")
    expect(toOrdinal(3)).toBe("3rd")
    expect(toOrdinal(4)).toBe("4th")
    expect(toOrdinal(11)).toBe("11th")
    expect(toOrdinal(12)).toBe("12th")
    expect(toOrdinal(13)).toBe("13th")
    expect(toOrdinal(21)).toBe("21st")
    expect(toOrdinal(112)).toBe("112th")
  })
})

describe("formatPosition", () => {
  it("respects none/top display modes", () => {
    expect(formatPosition(null, "all", 3)).toBe("")
    expect(formatPosition(1, "none", 3)).toBe("")
    expect(formatPosition(2, "top", 3)).toBe("2nd")
    expect(formatPosition(4, "top", 3)).toBe("")
    expect(formatPosition(4, "all", 3)).toBe("4th")
  })
})

describe("computeReportCard", () => {
  it("computes totals/average and dense-ranks ties (1,2,2 - never 3)", () => {
    const a = sheet("a", "A", [20, 20], 60) // 100
    const b = sheet("b", "B", [10, 10], 30) // 50
    const c = sheet("c", "C", [10, 10], 30) // 50
    const all = [a, b, c]

    const ra = computeReportCard(a, all, SCORE_CONFIG, BOUNDARIES, "all", 3)
    const rb = computeReportCard(b, all, SCORE_CONFIG, BOUNDARIES, "all", 3)
    const rc = computeReportCard(c, all, SCORE_CONFIG, BOUNDARIES, "all", 3)

    expect(ra.grandTotal).toBe(100)
    expect(ra.average).toBe(100)
    expect(ra.positionRank).toBe(1)
    expect(rb.positionRank).toBe(2)
    expect(rc.positionRank).toBe(2)
    expect([ra.position, rb.position, rc.position]).not.toContain("3rd")
  })

  it("leaves incomplete students unranked with null aggregates", () => {
    const complete = sheet("a", "A", [20, 20], 60)
    const incomplete = sheet("b", "B", [20, null], null)
    const all = [complete, incomplete]

    const result = computeReportCard(incomplete, all, SCORE_CONFIG, BOUNDARIES, "all", 3)

    expect(result.grandTotal).toBeNull()
    expect(result.average).toBeNull()
    expect(result.positionRank).toBeNull()
    expect(result.position).toBe("")
  })

  it("maps subject totals to grades using the scale", () => {
    const a = sheet("a", "A", [20, 20], 60)
    const result = computeReportCard(a, [a], SCORE_CONFIG, BOUNDARIES, "all", 3)
    expect(result.subjectRows[0]?.total).toBe(100)
    expect(result.subjectRows[0]?.grade).toBe("A")
  })
})
