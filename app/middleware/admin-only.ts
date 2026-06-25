export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, isAdmin, waitForSession } = useAuth()
  await waitForSession()

  // Redirect unauthenticated users to login
  if (!isLoggedIn.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
  }

  if (!isAdmin.value) {
    return navigateTo("/dashboard")
  }
})
