import { describe, expect, it } from "vitest"

import { capitalize, formatDate, timeAgo } from "./format"

describe("formatDate", () => {
  it("formats a valid ISO string", () => {
    const iso = "2024-01-15T12:00:00.000Z"
    const formatted = formatDate(iso)

    expect(formatted).not.toBe("Invalid date")
    expect(formatted).toBe(
      new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    )
    expect(formatted).toContain("2024")
  })

  it("prepends the optional prefix", () => {
    const iso = "2024-01-15T12:00:00.000Z"

    expect(formatDate(iso, "Due:")).toBe(`Due: ${formatDate(iso)}`)
  })

  it("accepts Date objects and numeric timestamps", () => {
    const date = new Date("2024-01-15T12:00:00.000Z")

    expect(formatDate(date)).toBe(formatDate(date.getTime()))
    expect(formatDate(date.getTime())).toBe(formatDate(date.toISOString()))
  })

  it("accepts numeric strings as timestamps", () => {
    const date = new Date("2024-01-15T12:00:00.000Z")

    expect(formatDate(String(date.getTime()))).toBe(formatDate(date))
  })

  it("returns 'Invalid date' for unparseable strings", () => {
    expect(formatDate("not-a-date")).toBe("Invalid date")
  })

  it("returns 'Invalid date' for undefined input", () => {
    expect(formatDate(undefined as unknown as string)).toBe("Invalid date")
  })
})

describe("timeAgo", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

  it("returns 'just now' for the current time", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now")
  })

  it("formats minutes, hours and days", () => {
    expect(timeAgo(ago(5 * 60_000))).toBe("5m ago")
    expect(timeAgo(ago(3 * 60 * 60_000))).toBe("3h ago")
    expect(timeAgo(ago(2 * 24 * 60 * 60_000))).toBe("2 days ago")
  })

  it("returns 'yesterday' for exactly one day ago", () => {
    expect(timeAgo(ago(24 * 60 * 60_000))).toBe("yesterday")
  })

  it("falls back to a locale date string after a week", () => {
    const old = ago(10 * 24 * 60 * 60_000)

    expect(timeAgo(old)).toBe(new Date(old).toLocaleDateString())
  })
})

describe("capitalize", () => {
  it("uppercases the first character only", () => {
    expect(capitalize("hello world")).toBe("Hello world")
    expect(capitalize("hello")).toBe("Hello")
  })

  it("leaves the remaining characters untouched", () => {
    expect(capitalize("HELLO")).toBe("HELLO")
  })

  it("handles an empty string", () => {
    expect(capitalize("")).toBe("")
  })
})
