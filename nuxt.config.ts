// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

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
  "class-variance-authority",
  "reka-ui",
  "clsx",
  "tailwind-merge"
]

export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },

  modules: [
    "@peterbud/nuxt-query",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "@nuxthub/core",
    "motion-v/nuxt",
    "vue-sonner/nuxt",
    "@vee-validate/nuxt",
    "@nuxtjs/color-mode"
  ],

  nuxtQuery: { autoImports: true },

  hub: {
    kv: true,
    db: { dialect: "sqlite", casing: "snake_case" }
  },

  css: ["~/assets/css/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      noDiscovery: true,
      include: optimizeDepsArr
    }
  },

  nitro: { experimental: { tasks: true } },

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
      {
        from: "tailwind-variants",
        name: "tv"
      },
      {
        from: "tailwind-variants",
        name: "VariantProps",
        type: true
      },
      {
        from: "vue-sonner",
        name: "toast",
        as: "useSonner"
      }
    ]
  },

  colorMode: {
    storageKey: "ScoreBase-color-mode",
    classSuffix: ""
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 0
    },
    mode: "svg",
    class: "shrink-0",
    fetchTimeout: 2000,
    serverBundle: "local"
  }
})