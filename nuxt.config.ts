// https://nuxt.com/docs/api/configuration/nuxt-config
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
      noDiscovery: true,
      include: [
        "@orpc/client",
        "@orpc/client/fetch",
        "@orpc/client/plugins",
        "@orpc/tanstack-query",
        "@tanstack/vue-query",
        "class-variance-authority",
        "reka-ui",
        "tailwind-variants",
        "clsx",
        "tailwind-merge",
      ],
    },
  },
  runtimeConfig: {
    betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },
});
