// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { computed } from "vue"
import { createDefaultRemarksConfig, type RemarksConfig } from "~~/shared/constants/report-card"

// RemarksBlock.vue relies on the Nuxt auto-imported `computed`. Vitest has no Nuxt/unimport
// transform, so expose it before the component module is evaluated.
vi.stubGlobal("computed", computed)

const RemarksBlock = (await import("./RemarksBlock.vue")).default

function config(): RemarksConfig {
  const defaults = createDefaultRemarksConfig()
  return {
    teacher: { ...defaults.teacher, visible: true },
    director: { ...defaults.director, visible: true }
  }
}

const mountRemarks = (part?: "all" | "teacher" | "director") =>
  mount(RemarksBlock, { props: { config: config(), part } })

describe("ReportCard/RemarksBlock", () => {
  it("draws both signature rows by default", () => {
    const wrapper = mountRemarks()

    expect(wrapper.text()).toContain("Class Teacher:")
    expect(wrapper.text()).toContain("Class Teacher's Comment:")
    expect(wrapper.text()).toContain("Director:")
  })

  it("draws only the requested row when the footer splits the block", () => {
    const teacher = mountRemarks("teacher")
    expect(teacher.text()).toContain("Class Teacher's Comment:")
    expect(teacher.text()).not.toContain("Director:")

    const director = mountRemarks("director")
    expect(director.text()).toContain("Director:")
    expect(director.text()).not.toContain("Class Teacher's Comment:")
  })

  it("keeps the label and comment on one line, separated by the label's colon and a space", () => {
    const wrapper = mountRemarks("teacher")
    const comment = wrapper
      .findAll("p")
      .find((node) => node.text().includes("Class Teacher's Comment:"))
    const text = comment?.text() ?? ""

    expect(text).toMatch(/^Class Teacher's Comment: \S/)
    expect(text).not.toMatch(/:  /)
  })
})
