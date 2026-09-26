import { ORPCError } from "@orpc/server"
import { describe, expect, it } from "vitest"

import type { APiContext } from "../context"

import { requireAdmin, requireClassAccess, requireSelf, requireSession } from "./auth-guard"

type FakeUser = { id: string; role: string; classId?: string | null }
type ErrorWithCode = { code: string }

const admin: FakeUser = { id: "user_admin", role: "admin", classId: null }
const teacher: FakeUser = { id: "user_teacher", role: "teacher", classId: "class_1" }
const teacherWithoutClass: FakeUser = { id: "user_teacher_2", role: "teacher", classId: null }

function contextWith(user: FakeUser | null): APiContext {
  return {
    session: user ? { user } : null,
    reqHeaders: new Headers()
  } as unknown as APiContext
}

function captureError(fn: () => unknown): ErrorWithCode {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(ORPCError)
    return error as ErrorWithCode
  }
  throw new Error("Expected the guard to throw")
}

describe("requireSession", () => {
  it("throws UNAUTHORIZED when there is no session", () => {
    expect(captureError(() => requireSession(contextWith(null))).code).toBe("UNAUTHORIZED")
  })

  it("returns the session user when present", () => {
    expect(requireSession(contextWith(teacher))?.id).toBe("user_teacher")
  })
})

describe("requireAdmin", () => {
  it("throws UNAUTHORIZED without a session", () => {
    expect(captureError(() => requireAdmin(contextWith(null))).code).toBe("UNAUTHORIZED")
  })

  it("throws FORBIDDEN for a non-admin user", () => {
    expect(captureError(() => requireAdmin(contextWith(teacher))).code).toBe("FORBIDDEN")
  })

  it("does not throw for an admin user", () => {
    expect(() => requireAdmin(contextWith(admin))).not.toThrow()
  })
})

describe("requireSelf", () => {
  it("throws UNAUTHORIZED without a session", () => {
    expect(captureError(() => requireSelf(contextWith(null), "user_admin")).code).toBe("UNAUTHORIZED")
  })

  it("throws FORBIDDEN when the id does not match the caller", () => {
    expect(captureError(() => requireSelf(contextWith(teacher), "someone_else")).code).toBe("FORBIDDEN")
  })

  it("does not throw when the id matches the caller", () => {
    expect(() => requireSelf(contextWith(teacher), "user_teacher")).not.toThrow()
  })
})

describe("requireClassAccess", () => {
  it("throws UNAUTHORIZED without a session", () => {
    expect(captureError(() => requireClassAccess(contextWith(null), "class_1")).code).toBe(
      "UNAUTHORIZED"
    )
  })

  it("allows an admin to access any class, even without a classId", () => {
    expect(() => requireClassAccess(contextWith(admin), "class_1")).not.toThrow()
    expect(() => requireClassAccess(contextWith(admin), "class_99")).not.toThrow()
    expect(() => requireClassAccess(contextWith(admin), null)).not.toThrow()
  })

  it("allows a teacher to access their own class", () => {
    expect(() => requireClassAccess(contextWith(teacher), "class_1")).not.toThrow()
  })

  it("throws FORBIDDEN for a different class", () => {
    expect(captureError(() => requireClassAccess(contextWith(teacher), "class_2")).code).toBe(
      "FORBIDDEN"
    )
  })

  it("throws FORBIDDEN when the classId is null or undefined", () => {
    expect(captureError(() => requireClassAccess(contextWith(teacher), null)).code).toBe("FORBIDDEN")
    expect(captureError(() => requireClassAccess(contextWith(teacher), undefined)).code).toBe(
      "FORBIDDEN"
    )
  })

  it("throws FORBIDDEN when the teacher has no assigned class", () => {
    expect(captureError(() => requireClassAccess(contextWith(teacherWithoutClass), "class_1")).code).toBe(
      "FORBIDDEN"
    )
  })
})
