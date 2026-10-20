import { describe, expect, it } from "vitest"

import { defaultTeacherPassword } from "./teacher-password"

describe("defaultTeacherPassword", () => {
  it("uses the surname (last word) of a full name", () => {
    expect(defaultTeacherPassword("John Emeka Olabisi")).toBe("pass-Olabisi-123")
  })

  it("handles a single-word name", () => {
    expect(defaultTeacherPassword("Aminu")).toBe("pass-Aminu-123")
  })

  it("ignores extra whitespace and empty segments", () => {
    expect(defaultTeacherPassword("  Ada   Nwosu  ")).toBe("pass-Nwosu-123")
  })

  it("does not throw on an empty name", () => {
    expect(defaultTeacherPassword("   ")).toBe("pass--123")
  })
})
