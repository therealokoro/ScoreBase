import { fileURLToPath } from "node:url"

import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Mirrors the Nuxt path aliases (see AGENTS.md § Directory layout) so unit tests can
// import source files the same way the app does. Put the two-character aliases first:
// Vite matches them in order, and `~` would otherwise swallow `~~`.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^~~\//, replacement: resolve("./") },
      { find: /^@@\//, replacement: resolve("./") },
      { find: /^#shared\//, replacement: resolve("./shared/") },
      { find: /^~\//, replacement: resolve("./app/") },
      { find: /^@\//, replacement: resolve("./app/") }
    ]
  },
  test: {
    environment: "node",
    include: [
      "shared/**/*.test.ts",
      "server/**/*.test.ts",
      "app/**/*.test.ts",
      "app/**/*.test.vue"
    ],
    exclude: ["**/node_modules/**", "**/.nuxt/**", "**/.output/**", "**/.data/**", "**/dist/**"]
  }
})
