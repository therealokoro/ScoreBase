import { db, schema } from "@nuxthub/db"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

export const getServerAuth = () => {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    plugins: [admin({ defaultRole: "teacher" })],
    user: {
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
}
