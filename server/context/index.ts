import type { RequestHeadersPluginContext } from "@orpc/server/plugins"

import type { ServerAuth } from "../utils/server-auth"

// Extend the context to carry the verified session so every router
// procedure can access it without re-querying the DB themselves.
export interface APiContext extends RequestHeadersPluginContext {
  session: Awaited<ReturnType<ServerAuth["api"]["getSession"]>> | null
}
