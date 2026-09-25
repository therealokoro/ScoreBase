import { describe, expect, it } from "vitest"

import { mergeSettings } from "./merge-settings"

describe("mergeSettings", () => {
  it("replaces arrays wholesale instead of concatenating them", () => {
    const stored = { gradeBoundaries: [{ label: "A" }] }
    const defaults = { gradeBoundaries: [{ label: "A" }, { label: "B" }] }

    expect(mergeSettings(stored, defaults).gradeBoundaries).toEqual([{ label: "A" }])
  })

  it("deep-merges nested objects, with the first argument winning", () => {
    const stored = { a: { x: 1 } }
    const defaults = { a: { x: 0, y: 2 }, b: 3 }

    expect(mergeSettings(stored, defaults)).toEqual({ a: { x: 1, y: 2 }, b: 3 })
  })

  it("fills missing keys from the defaults", () => {
    expect(mergeSettings({ a: 1 }, { a: 0, b: 2 })).toEqual({ a: 1, b: 2 })
  })
})
