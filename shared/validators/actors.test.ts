import { describe, expect, it } from "vitest"

import {
  UpdateAccountInfoSchema,
  UpdateAccountPasswordSchema,
  UpdateTeacherSchema,
  UpsertTeacherSchema
} from "./actors"

const VALID_TEACHER = {
  name: "Grace",
  email: "grace@example.com",
  phoneNumber: "08012345678"
}

describe("UpsertTeacherSchema", () => {
  it("accepts a name, email and 11-digit phone number", () => {
    expect(UpsertTeacherSchema.safeParse(VALID_TEACHER).success).toBe(true)
  })

  it("accepts an optional classId", () => {
    expect(UpsertTeacherSchema.safeParse({ ...VALID_TEACHER, classId: "class_1" }).success).toBe(
      true
    )
  })

  it("rejects a phone number that is not exactly 11 digits", () => {
    expect(UpsertTeacherSchema.safeParse({ ...VALID_TEACHER, phoneNumber: "123" }).success).toBe(
      false
    )
  })

  it("rejects a malformed email", () => {
    expect(UpsertTeacherSchema.safeParse({ ...VALID_TEACHER, email: "not-an-email" }).success).toBe(
      false
    )
  })

  it("requires name", () => {
    expect(
      UpsertTeacherSchema.safeParse({ email: "grace@example.com", phoneNumber: "08012345678" })
        .success
    ).toBe(false)
  })
})

describe("UpdateTeacherSchema", () => {
  it("accepts the upsert fields plus an id", () => {
    expect(UpdateTeacherSchema.safeParse({ ...VALID_TEACHER, id: "user_1" }).success).toBe(true)
  })

  it("requires id", () => {
    expect(UpdateTeacherSchema.safeParse(VALID_TEACHER).success).toBe(false)
  })

  it("still enforces the phone number rule", () => {
    expect(
      UpdateTeacherSchema.safeParse({ ...VALID_TEACHER, id: "user_1", phoneNumber: "08012" })
        .success
    ).toBe(false)
  })
})

describe("UpdateAccountInfoSchema", () => {
  it("accepts id, name, email and phone number", () => {
    expect(UpdateAccountInfoSchema.safeParse({ ...VALID_TEACHER, id: "user_1" }).success).toBe(true)
  })

  it("requires id", () => {
    expect(UpdateAccountInfoSchema.safeParse(VALID_TEACHER).success).toBe(false)
  })
})

describe("UpdateAccountPasswordSchema", () => {
  const VALID = {
    id: "user_1",
    currentPassword: "old-secret",
    newPassword: "new-secret",
    confirmPassword: "new-secret"
  }

  it("accepts matching new and confirm passwords", () => {
    expect(UpdateAccountPasswordSchema.safeParse(VALID).success).toBe(true)
  })

  it("rejects a confirmation that does not match the new password", () => {
    const result = UpdateAccountPasswordSchema.safeParse({ ...VALID, confirmPassword: "different" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "confirmPassword")).toBe(
        true
      )
    }
  })

  it("requires the current password", () => {
    expect(
      UpdateAccountPasswordSchema.safeParse({
        id: "user_1",
        newPassword: "new-secret",
        confirmPassword: "new-secret"
      }).success
    ).toBe(false)
  })

  it("requires the new password", () => {
    expect(
      UpdateAccountPasswordSchema.safeParse({
        id: "user_1",
        currentPassword: "old-secret",
        confirmPassword: "new-secret"
      }).success
    ).toBe(false)
  })
})
