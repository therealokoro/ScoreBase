// @vitest-environment happy-dom
import { mount } from "@vue/test-utils"
import { tv } from "tailwind-variants"
import { computed, resolveComponent, useSlots } from "vue"
import { describe, expect, it, vi } from "vitest"

// Button.vue relies on Nuxt auto-imports (`computed`, `useSlots`, `resolveComponent`, `tv`).
// Vitest has no Nuxt/unimport transform, so expose them on the global scope before the
// component module is evaluated. `tv` is used at import time, hence the dynamic import.
vi.stubGlobal("computed", computed)
vi.stubGlobal("useSlots", useSlots)
vi.stubGlobal("resolveComponent", resolveComponent)
vi.stubGlobal("tv", tv)

const Button = (await import("./Button.vue")).default

const mountButton = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(Button, {
    props,
    slots,
    global: { stubs: { Icon: true, NuxtLink: true } }
  })

describe("Ui/Button", () => {
  it("renders a native <button> with its default slot text", () => {
    const wrapper = mountButton({}, { default: "Save changes" })

    expect(wrapper.element.tagName).toBe("BUTTON")
    expect(wrapper.text()).toContain("Save changes")
  })

  it("exposes the `label` as aria-label when the button is icon-only", () => {
    const wrapper = mountButton({ icon: "lucide:plus", label: "Add student" })

    expect(wrapper.attributes("aria-label")).toBe("Add student")
  })

  it("does not set aria-label on a normal button with text", () => {
    const wrapper = mountButton({ label: "Should not apply" }, { default: "Click me" })

    expect(wrapper.text()).toContain("Click me")
    expect(wrapper.attributes("aria-label")).toBeUndefined()
  })

  it("renders the disabled attribute and disabled styles when disabled", () => {
    const wrapper = mountButton({ disabled: true }, { default: "Save" })

    expect(wrapper.attributes("disabled")).toBeDefined()
    expect(wrapper.classes()).toContain("pointer-events-none")
    expect(wrapper.classes()).toContain("opacity-50")
  })
})
