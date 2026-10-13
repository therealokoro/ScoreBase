import { describe, expect, it, vi } from "vitest"

import { ReportCardTemplateSchema } from "#shared/validators/report-card"

vi.mock("@nuxthub/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}))

// The task module calls Nitro's global `defineTask` at import time. Vitest has no
// unimport transform, so expose a passthrough before the dynamic import below.
;(globalThis as Record<string, unknown>).defineTask = (task: unknown) => task

const { buildJkTemplate } = await import("./seed-jk-template")

describe("buildJkTemplate", () => {
  it("matches the report card template schema", () => {
    const result = ReportCardTemplateSchema.safeParse(buildJkTemplate())
    expect(result.success).toBe(true)
  })

  it("carries the J.K. header lines with the badge after the third paragraph", () => {
    const template = buildJkTemplate()
    const school = template.header.find((block) => block.type === "school-info")
    if (school?.type !== "school-info") throw new Error("school-info block missing")

    expect(school.config.schoolName.value).toBe("J.K. PEOPLE'S COMPREHENSIVE ACADEMY")
    expect(school.config.showGovernmentApprovedBadge).toBe(true)
    expect(school.config.badgeAfterParagraph).toBe(3)
    expect(school.config.paragraphs.map((line) => line.value)).toEqual([
      "NASARAWA STATE MINISTRY OF EDUCATION",
      "KARU EDUCATION INSPECTORATE AREA",
      "(JUNIOR & SENIOR SECONDARY, SCIENCE & VOCATIONAL INSTITUTE)",
      "Nyanya/Mararaba Boundary, New Karu L.G.A, Nasarawa State, Nigeria",
      "Tel: 09-2903303, 08036466111, 08036458122, 08058046033",
      "P.O.Box 477 Mararaba, Nasarawa State",
      "MOTTO: Contentment Follows Enlightenment"
    ])
    expect(school.config.paragraphs[6]?.style.italic).toBe(true)
    expect(school.config.paragraphs[6]?.style.color).toBe("#EF4444")
  })

  it("uses the colours sampled from the printed card for the sub-lines", () => {
    const template = buildJkTemplate()
    const school = template.header[0]
    if (school?.type !== "school-info") throw new Error("school-info block missing")

    const [ministry, inspectorate, descriptor, address] = school.config.paragraphs
    expect(ministry?.style.color).toBe("#80AE7F")
    expect(inspectorate?.style.color).toBe("#80AE7F")
    expect(descriptor?.style.color).toBe("#5C697D")
    expect(address?.style.color).toBe("#5C697D")
    expect(school.config.schoolName.style.color).toBe("#CC0000")
  })

  it("uses four-column bordered student info and the grouped CA total scores table", () => {
    const template = buildJkTemplate()
    const studentInfo = template.studentInfo[0]
    const scores = template.main[0]
    if (studentInfo?.type !== "student-info") throw new Error("student-info block missing")
    if (scores?.type !== "scores") throw new Error("scores block missing")

    expect(studentInfo.config.columns).toBe(4)
    expect(studentInfo.config.borderStyle).toBe("bordered")
    expect(studentInfo.config.fields).toHaveLength(8)
    expect(scores.config.caDisplay).toBe("breakdown-grouped-total")
    expect(scores.config.columns).not.toContain("ca1")
    expect(scores.config.columnLabels.exam).toBe("Term Exam")
  })

  it("seeds the remarks, grading key and joined fee/next-term table", () => {
    const template = buildJkTemplate()
    expect(template.footer.map((block) => block.type)).toEqual([
      "remarks",
      "grading-key",
      "custom-table",
      "remarks"
    ])

    const remarks = template.footer[0]
    if (remarks?.type !== "remarks") throw new Error("remarks block missing")
    expect(remarks.config.teacher.visible).toBe(true)
    expect(remarks.config.teacher.layout).toBe("signature-comment")
    expect(remarks.config.principal.visible).toBe(false)
    // The director lives in its own block so it can sit under the term-info table.
    expect(remarks.config.director.visible).toBe(false)

    const gradingKey = template.footer[1]
    if (gradingKey?.type !== "grading-key") throw new Error("grading-key block missing")
    expect(gradingKey.config.displayStyle).toBe("list")

    const termInfo = template.footer[2]
    if (termInfo?.type !== "custom-table") throw new Error("custom-table block missing")
    expect(termInfo.config.layout).toBe("inline")
    // Three fee pairs on line one, the next-term date on line two of the same table.
    expect(termInfo.config.rows.map((row) => row.label)).toEqual([
      "Tuition Fee",
      "P.T.A",
      "Total",
      "Next Term Begins"
    ])
    expect(termInfo.config.rows.map((row) => row.newLine)).toEqual([false, false, false, true])

    const director = template.footer[3]
    if (director?.type !== "remarks") throw new Error("director remarks block missing")
    expect(director.config.teacher.visible).toBe(false)
    expect(director.config.director.visible).toBe(true)
  })

  it("uses square corners and prints the score maximums under the headings", () => {
    const template = buildJkTemplate()
    expect(template.borderRadius).toBe(0)

    const scores = template.main[0]
    if (scores?.type !== "scores") throw new Error("scores block missing")
    expect(scores.config.showScoreMax).toBe(true)
    // Maximums are never baked into the heading text; the switch controls the brackets.
    expect(scores.config.columnLabels.exam).toBe("Term Exam")
    expect(scores.config.columnLabels.total).toBe("Term Total")
  })

  it("lays the footer out in two columns: grading key left, term info and director right", () => {
    const template = buildJkTemplate()
    expect(template.footerLayout).toBe("columns")
    expect(template.footer.map((block) => block.column)).toEqual(["full", "left", "right", "right"])
  })

  it("gives every block a unique id", () => {
    const template = buildJkTemplate()
    const blocks = [
      ...template.header,
      ...template.studentInfo,
      ...template.main,
      ...template.footer
    ]
    const ids = blocks.map((block) => block.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
