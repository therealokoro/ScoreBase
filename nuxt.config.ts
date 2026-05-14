// https://nuxt.com/docs/api/configuration/nuxt-config
const optimizeDepsArr = [
  "@libsql/client",
  "@nuxthub/db",
  "@orpc/client",
  "@orpc/client/fetch",
  "@orpc/client/plugins",
  "@orpc/tanstack-query",
  "better-auth",
  "better-auth/adapters/drizzle",
  "better-auth/client/plugins",
  "better-auth/plugins",
  "better-auth/vue",
  "drizzle-orm",
  "drizzle-orm/sqlite-core",
];

export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },
  modules: ["@nuxthub/core"],
  hub: {
    kv: true,
    db: { dialect: "sqlite", casing: "snake_case" },
  },
  vite: {
    // plugins: [tailwindcss()],
    optimizeDeps: {
      // noDiscovery: true,
      include: optimizeDepsArr,
    },
  },
  runtimeConfig: {
    betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET,
    public: {
      betterAuthUrl: process.env.BETTER_AUTH_URL,
    },
  },
});
