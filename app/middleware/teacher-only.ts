import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"

export default defineNuxtRouteMiddleware(async (to) => {
  const rc = useRuntimeConfig()
  const client = createAuthClient({
    baseURL: rc.public.betterAuthUrl as string,
    plugins: [adminClient(), inferAdditionalFields()]
  })

  const { data } = await client.getSession()
  const userRole = ((data?.user as any)?.role as string | null) ?? null

  if (userRole !== "teacher") {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } })
  }
})