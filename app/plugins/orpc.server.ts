import { createRouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { apiRouter, type APIRouterClient } from "~~/server/routers"

export default defineNuxtPlugin(() => {
  // Server-side router client. With `ssr: false` this plugin never runs, but the
  // context is supplied so the call is type-correct.
  const client: APIRouterClient = createRouterClient(apiRouter, {
    context: { session: null }
  })
  const orpc = createTanstackQueryUtils(client)
  return { provide: { orpc } }
})
