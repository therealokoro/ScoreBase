// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { computed } from "vue"
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import { createDefaultScoresConfig, type ScoresConfig } from "~~/shared/constants/report-card"

// ScoresBlock.vue relies on the Nuxt auto-imported `computed`. Vitest has no Nuxt/unimport
// transform, so expose it before the component module is evaluated.
vi.stubGlobal("computed", computed)

const ScoresBlock = (await import("./ScoresBlock.vue")).default

/** The J.K. card's scores config: grouped CA breakdown plus a separate CA Total column. */
function jkConfig(): ScoresConfig {
  return {
    ...createDefaultScoresConfig(),
    caDisplay: "breakdown-grouped-total",
    columns: ["subject", "exam", "total", "grade", "classAverage", "subjectPosition", "remark"],
    columnLabels: {
      subject: "Subjects",
      exam: "Term Exam",
      total: "Term Total",
      grade: "Term Grade",
      classAverage: "Class Avg.",
      subjectPosition: "Subject Position",
      remark: "Remarks"
    }
  }
}

/** Minimal `ReportCardData` double — only the fields `normalizeReportCardData` reads. */
function fakeData(caCount: number): ReportCardData {
  const caScores = Array.from({ length: caCount }, () => 5)
  return {
    computed: {
      studentName: "Test Student",
      studentSchoolId: "STU-1",
      subjectRows: [
        {
          id: "r1",
          subjectId: "s1",
          subjectName: "Horticulture and Crop Production",
          caScores,
          caTotal: 5 * caCount,
          exam: 40,
          total: 40 + 5 * caCount,
          grade: "A",
          remark: "Excellent"
        }
      ],
      grandTotal: 100,
      average: 80,
      position: "1st",
      subjectCount: 1
    },
    class: { name: "SSS 2B" },
    term: { name: "3rd Term", session: { name: "2025/2026" } },
    scoreConfig: { caCount, caMaxScores: Array.from({ length: caCount }, () => 10), examMax: 70 },
    totalStudents: 41,
    teacherRemark: null,
    principalRemark: null,
    allStudentTotals: [90],
    subjectClassData: [{ subjectId: "s1", totals: [90, 80] }]
  } as unknown as ReportCardData
}

function mountScores(caCount: number, config: ScoresConfig = jkConfig()) {
  const wrapper = mount(ScoresBlock, { props: { config, data: fakeData(caCount) } })
  const heads = wrapper.findAll("thead th").map((head) => ({
    text: head.text().replace(/\s+/g, " ").trim(),
    colspan: head.attributes("colspan") ?? "1",
    rowspan: head.attributes("rowspan") ?? "1"
  }))
  return { wrapper, heads }
}

describe("ReportCard/ScoresBlock grouped header", () => {
  it.each([2, 3, 4])("derives the Assessments span from %i CA columns", (caCount) => {
    const { heads } = mountScores(caCount)

    const group = heads.find((head) => head.text === "Assessments")
    expect(group?.colspan).toBe(String(caCount))

    // Child row: one ordinal head per CA, each carrying its own max.
    const childHeads = heads.filter((head) => /^\d(st|nd|rd|th)\(10\)$/.test(head.text))
    expect(childHeads).toHaveLength(caCount)
    expect(childHeads.map((head) => head.text)).toEqual(
      Array.from({ length: caCount }, (_, index) => {
        const ordinal = ["1st", "2nd", "3rd", "4th", "5th"][index]
        return `${ordinal}(10)`
      })
    )
  })

  it("spans every non-CA head across both header rows, with the maximum under the label", () => {
    const { heads } = mountScores(3)

    // "Assessments" is the only head that is not a two-row head or a CA child.
    const spanned = heads.filter((head) => head.rowspan === "2")
    expect(spanned.map((head) => head.text)).toEqual([
      "Subjects",
      "CA Total(30)",
      "Term Exam(70)",
      "Term Total(100)",
      "Term Grade",
      "Class Avg.",
      "Subject Position",
      "Remarks"
    ])
    expect(
      heads.filter((head) => head.rowspan === "1" && head.text !== "Assessments")
    ).toHaveLength(3)
  })

  it("hides every bracketed maximum at once when the switch is off", () => {
    const { heads } = mountScores(3, { ...jkConfig(), showScoreMax: false })

    expect(heads.some((head) => head.text.includes("("))).toBe(false)
    // The group and its child labels survive; only the brackets go.
    expect(heads.some((head) => head.text === "Assessments")).toBe(true)
    expect(heads.some((head) => head.text === "1st")).toBe(true)
  })

  it("uses a fixed layout with one width per column that sums to 100%", () => {
    const { wrapper } = mountScores(3)

    expect(wrapper.find("table").classes()).toContain("table-fixed")
    const cols = wrapper.findAll("colgroup col")
    // subject + 3 CA + CA Total + exam + total + grade + classAverage + subjectPosition + remark
    expect(cols).toHaveLength(11)

    const total = cols
      .map((col) =>
        Number.parseFloat(col.attributes("style")?.match(/width:\s*([\d.]+)%/)?.[1] ?? "0")
      )
      .reduce((sum, width) => sum + width, 0)
    expect(total).toBeGreaterThan(99.9)
    expect(total).toBeLessThan(100.1)
  })

  it("keeps the single-row header for non-grouped CA displays", () => {
    const config: ScoresConfig = { ...jkConfig(), caDisplay: "breakdown-single" }
    const { heads } = mountScores(3, config)

    expect(heads.some((head) => head.text === "Assessments")).toBe(false)
    expect(heads.filter((head) => head.text.startsWith("CA ")).map((head) => head.text)).toEqual([
      "CA 1(10)",
      "CA 2(10)",
      "CA 3(10)"
    ])
    expect(heads.filter((head) => head.rowspan === "2")).toHaveLength(0)
  })
})
