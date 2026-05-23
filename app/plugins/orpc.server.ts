import { createRouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { apiRouter, type APIRouterClient } from "~~/server/routers"

export default defineNuxtPlugin(() => {
  const client: APIRouterClient = createRouterClient(apiRouter, {})
  const orpc = createTanstackQueryUtils(client)
  return { provide: { orpc } }
})
