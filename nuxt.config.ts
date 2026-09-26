// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

import { ICONS } from "./shared/constants/icons"

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
  "@tanstack/vue-query",
  "reka-ui"
]

export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },
  ssr: false,

  modules: [
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "@nuxthub/core",
    "@formkit/nuxt",
    "vue-sonner/nuxt",
    "@nuxtjs/color-mode"
  ],

  hub: {
    kv: true,
    db: { dialect: "sqlite", casing: "snake_case" }
  },

  css: ["~/assets/css/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { noDiscovery: true, include: optimizeDepsArr }
  },

  // Nitro's built-in task endpoints are unauthenticated; only expose them in
  // development. Production seeding/seeding-style operations run via the CLI.
  nitro: { experimental: { tasks: process.env.NODE_ENV !== "production" } },

  runtimeConfig: {
    betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET,
    defaultAdminEmail: process.env.NUXT_DEFAULT_ADMIN_EMAIL,
    defaultAdminPass: process.env.NUXT_DEFAULT_ADMIN_PASS,
    defaultAdminName: process.env.NUXT_DEFAULT_ADMIN_NAME,
    defaultAdminPhone: process.env.NUXT_DEFAULT_ADMIN_PHONE,
    public: {
      betterAuthUrl: process.env.BETTER_AUTH_URL
    }
  },

  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" }
    ],
    presets: [
      {
        from: "@tanstack/vue-query",
        imports: ["useQuery", "useMutation", "useQueryClient"]
      }
    ]
  },

  formkit: {
    autoImport: true,
    configFile: "./app/formkit.config.ts"
  },

  colorMode: {
    classSuffix: "",
    storageKey: "ScoreBase-color-mode"
  },

  icon: {
    mode: "svg",
    class: "shrink-0",
    fetchTimeout: 2000,
    provider: "server",
    serverBundle: "local",
    // `scan` picks up icons used as literals; the explicit list adds the dynamically bound
    // `ICONS` map values, which the scanner cannot see. Together they keep icon requests out
    // of the runtime (no per-icon fetch / blank-first pop-in).
    clientBundle: { scan: true, icons: Object.values(ICONS), sizeLimitKb: 0 }
  }
})
