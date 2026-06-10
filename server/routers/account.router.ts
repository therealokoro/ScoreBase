import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { accountContract } from "../contracts/account.contract"
import { user } from "../db/schema"
import { serverAuth } from "../utils/server-auth"

const os = implement(accountContract).$context<APiContext>()

const updateAccount = os.updateInfo.handler(async ({ input, errors }) => {
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
    console.log(error)
    throw errors.INCORRECT_PASSWORD({ message: error.message })
  }
})

export const accountRouter = {
  updateAccount,
  updatePassword
}
