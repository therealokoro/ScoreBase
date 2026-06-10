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
      }
    }
  },
  session: { modelName: "user_session" }
})

export type ServerAuth = typeof serverAuth
