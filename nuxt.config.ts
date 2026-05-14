// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

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
  "tailwind-merge",
];

export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },
  modules: [
    "shadcn-nuxt",
    "@peterbud/nuxt-query",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "@nuxthub/core",
  ],
  nuxtQuery: { autoImports: true },
  hub: {
    kv: true,
    db: { dialect: "sqlite", casing: "snake_case" },
  },
  components: [{ path: "~/components", ignore: ["ui/**", "form/**"] }],
  shadcn: { prefix: "Ui", componentDir: "@/components/ui" },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      noDiscovery: true,
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
