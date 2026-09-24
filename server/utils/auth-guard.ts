import { ORPCError } from "@orpc/server"

import type { APiContext } from "../context"

/**
 * Guards an admin-only oRPC handler.
 *
 * Throws UNAUTHORIZED when there is no session and FORBIDDEN when the authenticated user is not an
 * admin. Call it at the top of the handler body:
 *
 * RequireAdmin(context)
 */
export function requireAdmin(context: APiContext): void {
  const user = context.session?.user
  if (!user) throw new ORPCError("UNAUTHORIZED")
  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Only admins can perform this action" })
  }
}

/**
 * Guards an action that may only target the caller's own account.
 *
 * RequireSelf(context, input.id)
 */
export function requireSelf(context: APiContext, id: string): void {
  const user = context.session?.user
  if (!user) throw new ORPCError("UNAUTHORIZED")
  if (user.id !== id) {
    throw new ORPCError("FORBIDDEN", {
      message: "You can only perform this action on your own account"
    })
  }
}

/**
 * Guards access to a class. Admins may access any class; a teacher may only access their own
 * assigned class. Use it before reading or mutating a class-scoped record.
 *
 * RequireClassAccess(context, student.classId)
 */
export function requireClassAccess(context: APiContext, classId: string | null | undefined): void {
  const user = context.session?.user
  if (!user) throw new ORPCError("UNAUTHORIZED")
  if (user.role === "admin") return
  if (!classId || user.classId !== classId) {
    throw new ORPCError("FORBIDDEN", { message: "You do not have access to this class" })
  }
}
