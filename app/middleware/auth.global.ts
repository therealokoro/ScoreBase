import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"

export default defineNuxtRouteMiddleware(async (to) => {
  const rc = useRuntimeConfig()
  const client = createAuthClient({
    baseURL: rc.public.betterAuthUrl as string,
    plugins: [adminClient(), inferAdditionalFields()]
  })

  const { data } = await client.getSession()

  const isLoggedIn = data !== null
  const userRole = ((data?.user as any)?.role as string | null) ?? null

  // ── Root redirect ──────────────────────────────────────────────────────────
  if (to.path === "/") {
    if (import.meta.server) return
    return navigateTo(isLoggedIn ? "/dashboard" : "/login")
  }

  // ── Already logged in, don't allow visiting /login ─────────────────────────
  if (to.path === "/login" && isLoggedIn) {
    return navigateTo("/dashboard")
  }

  // ── Protected routes ───────────────────────────────────────────────────────
  if (to.path.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
    }

    const ADMIN_ONLY_PAGES = [
      "/dashboard/classes",
      "/dashboard/sessions",
      "/dashboard/subjects",
      "/dashboard/teachers"
    ]

    const isAdminRoute = ADMIN_ONLY_PAGES.some(
      (route) => to.path === route || to.path.startsWith(route + "/")
    )

    if (isAdminRoute && userRole !== "admin") {
      return navigateTo("/dashboard")
    }
  }
})
