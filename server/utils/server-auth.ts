import { db, schema } from "@nuxthub/db"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

export const serverAuth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    changeEmail: {
      enabled: true
    }
  },
  plugins: [admin({ defaultRole: "teacher" as "user" | "admin" })],
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true
    },
    additionalFields: {
      phoneNumber: {
        type: "string",
        required: true,
        unique: true,
        returned: true
      },
      classId: {
        type: "string",
        required: false, // nullable — teacher may not be assigned yet
        returned: true, // ✅ included in session user
        input: false // not settable directly via auth endpoints; managed by your own API
      }
    }
  },
  session: { modelName: "user_session" }
})

export type ServerAuth = typeof serverAuth
