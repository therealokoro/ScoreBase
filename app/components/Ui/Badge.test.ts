// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { tv } from "tailwind-variants"
import { computed, resolveComponent } from "vue"
import { describe, expect, it, vi } from "vitest"

// Badge.vue relies on Nuxt auto-imports (`computed`, `resolveComponent`, `tv`). Vitest has
// no Nuxt/unimport transform, so expose them on the global scope before the component
// module is evaluated. `tv` is used at import time, hence the dynamic import.
vi.stubGlobal("computed", computed)
vi.stubGlobal("resolveComponent", resolveComponent)
vi.stubGlobal("tv", tv)

const Badge = (await import("./Badge.vue")).default

type BadgeVariant =
  | "default"
  | "secondary"
  | "grey"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "ghost"
  | "error"

const mountBadge = (variant: BadgeVariant) =>
  mount(Badge, {
    props: { variant },
    slots: { default: variant },
    global: { stubs: { NuxtLink: true } }
  })

describe("Ui/Badge", () => {
  it.each<[BadgeVariant, string]>([
    ["success", "bg-success"],
    ["warning", "bg-warning"],
    ["info", "bg-info"],
    ["destructive", "bg-destructive"],
    ["error", "bg-destructive"]
  ])("renders the %s variant with the %s token class", (variant, token) => {
    const wrapper = mountBadge(variant)

    expect(wrapper.element.tagName).toBe("DIV")
    expect(wrapper.text()).toContain(variant)
    expect(wrapper.classes()).toContain(token)
  })

  it("renders the default variant with the primary token", () => {
    const wrapper = mount(Badge, { slots: { default: "New" } })

    expect(wrapper.element.tagName).toBe("DIV")
    expect(wrapper.classes()).toContain("bg-primary")
  })
})
