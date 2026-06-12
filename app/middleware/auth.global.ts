export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on the server — better-auth's Vue client is browser-only.
  if (import.meta.server) return

  const { isLoggedIn, currentUser, waitForSession } = useAuth()

  // Wait for the session fetch to fully complete. waitForSession() watches
  // isPending with { immediate: true }, so if it's already false this resolves
  // on the same tick with no async penalty on subsequent navigations.
  await waitForSession()

  const isAuthenticated = isLoggedIn.value
  const userRole = ((currentUser.value as any)?.role as string | null) ?? null

  // ── Already logged in, don't allow visiting /login ──────────────────────
  if (isAuthenticated && to.path === "/login") {
    return navigateTo("/dashboard")
  }

  // ── Protected routes ─────────────────────────────────────────────────────
  if (to.path.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
    }

    // block routing to this pages if user is not an admin
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
