// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { describe, expect, it, vi } from "vitest"
import { computed } from "vue"
import {
  createDefaultSchoolInfoConfig,
  type SchoolInfoConfig
} from "~~/shared/constants/report-card"

// SchoolInfoBlock.vue relies on the Nuxt auto-imported `computed`. Vitest has no Nuxt/unimport
// transform, so expose it before the component module is evaluated.
vi.stubGlobal("computed", computed)

const SchoolInfoBlock = (await import("./SchoolInfoBlock.vue")).default

function config(overrides: Partial<SchoolInfoConfig> = {}): SchoolInfoConfig {
  return {
    ...createDefaultSchoolInfoConfig(),
    logoPlacement: "left-right",
    schoolName: {
      value: "J.K. PEOPLE'S COMPREHENSIVE ACADEMY",
      style: { fontSize: 22, fontWeight: "bold", italic: false, color: "#CC0000", align: "center" }
    },
    ...overrides
  }
}

const mountHeader = (overrides: Partial<SchoolInfoConfig> = {}) =>
  mount(SchoolInfoBlock, { props: { config: config(overrides) } })

describe("ReportCard/SchoolInfoBlock header layout", () => {
  it("keeps the centre column in normal document flow (regression: absolute centring collapsed the header)", () => {
    const wrapper = mountHeader()
    const root = wrapper.get("[data-block-type='school-info']")

    // No absolutely positioned wrapper anywhere in the header: an out-of-flow centre column gave
    // the block no height, so the student-info grid rendered on top of the header text.
    expect(root.html()).not.toContain("absolute")
    expect(root.html()).not.toContain("relative")
  })

  it("places the logos either side of an in-flow centre column", () => {
    const wrapper = mountHeader({
      logoPrimary: "report-card/logo-primary",
      logoSecondary: "report-card/logo-secondary"
    })

    const row = wrapper.get("[data-block-type='school-info'] > div")
    const children = [...row.element.children]
    expect(children.map((child) => child.tagName)).toEqual(["IMG", "DIV", "IMG"])

    const centre = children[1] as HTMLElement
    expect(centre.className).toContain("flex-1")
    expect(centre.className).toContain("min-w-0")
    expect(centre.textContent).toContain("J.K. PEOPLE'S COMPREHENSIVE ACADEMY")

    // Centre sits between the two logos, which the flex row pins to either edge.
    expect(row.classes()).toContain("justify-between")
  })

  it("spaces the centre column when only one logo is configured", () => {
    const wrapper = mountHeader({ logoPrimary: "report-card/logo-primary", logoSecondary: null })

    const row = wrapper.get("[data-block-type='school-info'] > div")
    const children = [...row.element.children]
    // Secondary falls back to the primary logo, so both sides render and no spacer is needed.
    expect(children.map((child) => child.tagName)).toEqual(["IMG", "DIV", "IMG"])
    expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(0)
  })

  it("takes the full width when no logos are configured", () => {
    const wrapper = mountHeader({
      logoPrimary: null,
      logoSecondary: null,
      showGovernmentApprovedBadge: true
    })

    const row = wrapper.get("[data-block-type='school-info'] > div")
    expect([...row.element.children].map((child) => child.tagName)).toEqual(["DIV"])
    expect(wrapper.findAll("img")).toHaveLength(0)
    expect(wrapper.findAll("[aria-hidden='true']")).toHaveLength(0)
    expect(wrapper.text()).toContain("GOVERNMENT APPROVED")
  })

  it("keeps every header line and the badge inside the block", () => {
    const wrapper = mountHeader({
      paragraphs: [
        {
          value: "NASARAWA STATE MINISTRY OF EDUCATION",
          style: {
            fontSize: 13,
            fontWeight: "bold",
            italic: false,
            color: "#80AE7F",
            align: "center"
          }
        },
        {
          value: "Nyanya/Mararaba Boundary, New Karu L.G.A, Nasarawa State, Nigeria",
          style: {
            fontSize: 10,
            fontWeight: "normal",
            italic: false,
            color: "#5C697D",
            align: "center"
          }
        }
      ],
      showGovernmentApprovedBadge: true,
      badgeAfterParagraph: 1
    })

    const centre = wrapper.get("[data-block-type='school-info'] > div > div")
    expect(centre.text()).toContain("NASARAWA STATE MINISTRY OF EDUCATION")
    expect(centre.text()).toContain("Nyanya/Mararaba Boundary")
    expect(centre.text()).toContain("GOVERNMENT APPROVED")
  })
})
