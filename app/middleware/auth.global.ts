import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"

export default defineNuxtRouteMiddleware(async (to) => {
  // Build a plain auth client. baseURL must be absolute for SSR.
  const rc = useRuntimeConfig()
  const client = createAuthClient({
    baseURL: rc.public.betterAuthUrl as string,
    plugins: [adminClient(), inferAdditionalFields()]
  })

  // getSession() is a plain fetch — safe to call in middleware on both
  // server (with the request cookie forwarded by better-auth/vue's SSR
  // support) and client.
  const { data } = await client.getSession()

  const isLoggedIn = data !== null
  const userRole = ((data?.user as any)?.role as string | null) ?? null

  // ── / ─────────────────────────────────────────────────────────────────────
  // Skip on SSR — let the client run this redirect so there's no two-hop
  // flash through /login. The blank index.vue renders for a single frame
  // then the client-side middleware fires and jumps straight to the dashboard.
  if (to.path === "/") {
    if (import.meta.server) return
    if (isLoggedIn) {
      if (userRole === "admin") return navigateTo("/admin", { replace: true })
      if (userRole === "teacher") return navigateTo("/teacher", { replace: true })
    }
    return navigateTo("/login", { replace: true })
  }

  // ── /login ────────────────────────────────────────────────────────────────
  if (to.path.startsWith("/login")) {
    if (isLoggedIn) {
      if (userRole === "admin") return navigateTo("/admin")
      if (userRole === "teacher") return navigateTo("/teacher")
      return // unrecognised role — stay on login
    }
    return // unauthenticated — allow access
  }

  // ── /admin ────────────────────────────────────────────────────────────────
  if (to.path.startsWith("/admin")) {
    if (!isLoggedIn || userRole !== "admin") {
      return navigateTo({ path: "/", query: { redirect: to.fullPath } })
    }
    return
  }

  // ── /teacher ──────────────────────────────────────────────────────────────
  if (to.path.startsWith("/teacher")) {
    if (!isLoggedIn || (userRole !== "teacher" && userRole !== "admin")) {
      return navigateTo({ path: "/", query: { redirect: to.fullPath } })
    }
    return
  }
})
