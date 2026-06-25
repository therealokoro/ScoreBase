export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, user, waitForSession } = useAuth()
  await waitForSession()

  // Redirect unauthenticated users to login
  if (!isLoggedIn.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
  }

  if (user.value.role !== "teacher") {
    return navigateTo("/dashboard")
  }
})
