export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, currentUser } = useAuth()

  // Redirect unauthenticated users to login
  if (!isLoggedIn.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
  }

  const userRole = ((currentUser.value as any)?.role as string | null) ?? null

  if (userRole !== "admin") {
    return navigateTo("/dashboard")
  }
})
