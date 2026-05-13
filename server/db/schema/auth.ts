import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { typeid } from "typeid-js";

import { dateTimeSchema } from "./common";

export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("user").toString()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  phoneNumber: text("phone_number").notNull().unique(),
  ...dateTimeSchema,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .$default(() => typeid("session").toString()),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...dateTimeSchema,
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$default(() => typeid("account").toString()),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    ...dateTimeSchema,
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$default(() => typeid("verification").toString()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    ...dateTimeSchema,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
