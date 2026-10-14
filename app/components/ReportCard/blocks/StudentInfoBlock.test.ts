// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { computed } from "vue"
import {
  createDefaultStudentInfoConfig,
  type StudentInfoConfig
} from "~~/shared/constants/report-card"

// StudentInfoBlock.vue relies on the Nuxt auto-imported `computed`. Vitest has no Nuxt/unimport
// transform, so expose it before the component module is evaluated.
vi.stubGlobal("computed", computed)

const StudentInfoBlock = (await import("./StudentInfoBlock.vue")).default

function config(overrides: Partial<StudentInfoConfig> = {}): StudentInfoConfig {
  return { ...createDefaultStudentInfoConfig(), ...overrides }
}

const mountGrid = (overrides: Partial<StudentInfoConfig> = {}) =>
  mount(StudentInfoBlock, { props: { config: config(overrides) } })

/** The J.K. card's eight fields, so the 4x2 grid edge cases are exercised. */
function eightFields(): StudentInfoConfig["fields"] {
  const fields = [
    "session.name",
    "term.name",
    "student.id",
    "student.name",
    "student.class",
    "result.average",
    "class.size",
    "result.position"
  ] as const
  return fields.map((field, index) => ({ id: `field-${index}`, field, label: `Label ${index}` }))
}

describe("ReportCard/StudentInfoBlock grid", () => {
  it("scales the outer and inner rules from the border thickness setting", () => {
    const wrapper = mountGrid({
      columns: 4,
      borderStyle: "bordered",
      borderWidth: 3,
      fields: eightFields()
    })

    expect(wrapper.get("[data-block-type='student-info']").attributes("style")).toContain(
      "border-width: 3px"
    )

    const cells = wrapper.findAll("[data-block-type='student-info'] .grid > div")
    expect(cells).toHaveLength(8)
    // Interior cells draw 3px inner rules on both axes.
    expect(cells[0]?.attributes("style")).toContain("border-right-width: 3px")
    expect(cells[0]?.attributes("style")).toContain("border-bottom-width: 3px")
  })

  it("drops the inner rules on the last column and last row so edges stay single", () => {
    const wrapper = mountGrid({
      columns: 4,
      borderStyle: "bordered",
      borderWidth: 2,
      fields: eightFields()
    })
    const cells = wrapper.findAll("[data-block-type='student-info'] .grid > div")

    // 8 fields in 4 columns: indexes 3 and 7 are the last column, 4-7 the last row.
    expect(cells[3]?.attributes("style")).toContain("border-right-width: 0px")
    expect(cells[4]?.attributes("style")).toContain("border-bottom-width: 0px")
    expect(cells[7]?.attributes("style")).toContain("border-right-width: 0px")
    expect(cells[7]?.attributes("style")).toContain("border-bottom-width: 0px")
  })

  it("keeps the cells compact and ignores the setting when borderless", () => {
    const bordered = mountGrid({ borderStyle: "bordered" })
    const cell = bordered.get("[data-block-type='student-info'] .grid > div")
    expect(cell.classes()).toContain("p-1.5")

    const borderless = mountGrid({ borderStyle: "borderless", borderWidth: 4 })
    expect(
      borderless.get("[data-block-type='student-info']").attributes("style") ?? ""
    ).not.toContain("border-width")
  })
})
