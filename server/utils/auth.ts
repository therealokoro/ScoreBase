import { db, schema } from "@nuxthub/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

export const getServerAuth = () => {
  const rc = useRuntimeConfig();
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    plugins: [admin()],
    baseURL: rc.public.siteUrl,
    user: {
      additionalFields: {
        phoneNumber: { type: "string", fieldName: "phone_number", required: true, unique: true },
      },
    },
  });
};
