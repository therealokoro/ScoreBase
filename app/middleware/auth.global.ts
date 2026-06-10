export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on the server — better-auth's Vue client is browser-only.
  if (import.meta.server) return

  const { isLoggedIn, currentUser, isPending } = useAuth()

  // Only wait if session is still loading. On the first hard refresh isPending
  // starts true; on every subsequent navigation it is already false so this
  // entire block is skipped synchronously — no delay on in-app navigations.
  if (isPending.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        isPending,
        (pending) => {
          if (!pending) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  const isAuthenticated = isLoggedIn.value
  const userRole = ((currentUser.value as any)?.role as string | null) ?? null

  // ── Already logged in, don't allow visiting /login ──────────────────────
  if (to.path === "/login" && isAuthenticated) {
    return navigateTo("/dashboard")
  }

  // ── Protected routes ─────────────────────────────────────────────────────
  if (to.path.startsWith("/dashboard")) {
    if (!isAuthenticated) {
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
