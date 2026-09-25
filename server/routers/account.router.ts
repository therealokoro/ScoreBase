import { db } from "@nuxthub/db"
import { ORPCError, implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { accountContract } from "../contracts/account.contract"
import { user } from "../db/schema"
import { requireSelf } from "../utils/auth-guard"
import { serverAuth } from "../utils/server-auth"

const os = implement(accountContract).$context<APiContext>()

const updateAccount = os.updateInfo.handler(async ({ input, errors, context }) => {
  requireSelf(context, input.id)

  const existingAccount = await db.query.user.findFirst({ where: eq(user.id, input.id) })
  if (!existingAccount) throw errors.NOT_FOUND()

  if (input.email !== existingAccount.email) {
    const emailExist = await db.query.user.findFirst({ where: eq(user.email, input.email) })
    if (emailExist) throw errors.CONFLICT({ message: "This email is already taken" })
  }

  if (input.phoneNumber !== existingAccount.phoneNumber) {
    const phoneNoExist = await db.query.user.findFirst({
      where: eq(user.phoneNumber, input.phoneNumber)
    })
    if (phoneNoExist) throw errors.CONFLICT({ message: "This phone number is already taken" })
  }

  await db
    .update(user)
    .set({ ...input })
    .where(eq(user.id, input.id))
    .returning()
})

const updatePassword = os.updatePassword.handler(async ({ input, errors, context }) => {
  requireSelf(context, input.id)

  const existingAccount = await db.query.user.findFirst({ where: eq(user.id, input.id) })
  if (!existingAccount) throw errors.NOT_FOUND()

  // Use the singleton — no more re-initialization on every call.
  // context.reqHeaders carries the original request headers (including the
  // session cookie) forwarded by RequestHeadersPlugin, which better-auth
  // needs to validate the current session for changePassword.
  try {
    await serverAuth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword
      },
      headers: context.reqHeaders
    })
  } catch (error: any) {
    const code: string | undefined = error?.body?.code ?? error?.code
    const status: number | undefined = error?.status

    // Only genuine credential failures should be reported as an incorrect password.
    if (code === "INVALID_PASSWORD" || status === 401) {
      throw errors.INCORRECT_PASSWORD({ message: "Your current password is incorrect" })
    }
    if (status === 400 || code === "PASSWORD_TOO_SHORT") {
      throw errors.BAD_REQUEST({
        message: error?.body?.message ?? "The new password does not meet the requirements"
      })
    }

    console.error("changePassword failed", { code, status })
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Could not change your password" })
  }
})

export const accountRouter = {
  updateAccount,
  updatePassword
}
