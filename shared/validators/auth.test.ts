import { describe, expect, it } from "vitest"

import { LoginSchema } from "./auth"

describe("LoginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(LoginSchema.safeParse({ email: "admin@example.com", password: "secret" }).success).toBe(
      true
    )
  })

  it("rejects a malformed email", () => {
    expect(LoginSchema.safeParse({ email: "not-an-email", password: "secret" }).success).toBe(false)
  })

  it("requires a password", () => {
    expect(LoginSchema.safeParse({ email: "admin@example.com" }).success).toBe(false)
  })

  it("requires an email", () => {
    expect(LoginSchema.safeParse({ password: "secret" }).success).toBe(false)
  })
})
