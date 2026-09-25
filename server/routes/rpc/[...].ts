import { onError } from "@orpc/server"
import { RPCHandler, BodyLimitPlugin } from "@orpc/server/fetch"
import {
  CORSPlugin,
  RequestHeadersPlugin,
  SimpleCsrfProtectionHandlerPlugin
} from "@orpc/server/plugins"
import type { APiContext } from "~~/server/context"
import { apiRouter } from "~~/server/routers"
import { loggingInterceptor } from "~~/server/utils/logger"
import { serverAuth } from "~~/server/utils/server-auth"

/**
 * Builds the allowlist of origins permitted to call the RPC surface.
 *
 * The surface is credentialed, so it must never reflect arbitrary origins. We allow the configured
 * app origin (`BETTER_AUTH_URL`), the incoming request's own origin (same-origin callers), and —
 * in development only — the common localhost ports.
 */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>()

  const configured = useRuntimeConfig().public.betterAuthUrl as string | undefined
  if (configured) {
    try {
      origins.add(new URL(configured).origin)
    } catch {
      // ignore malformed config
    }
  }

  try {
    const event = useRequestEvent()
    if (event) origins.add(getRequestURL(event).origin)
  } catch {
    // no active request context (e.g. module init)
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000")
    origins.add("http://127.0.0.1:3000")
  }

  return origins
}

const handler = new RPCHandler(apiRouter, {
  clientInterceptors: [loggingInterceptor],
  plugins: [
    new CORSPlugin({
      // Only echo origins on the allowlist; anything else gets no CORS header,
      // so the browser blocks the credentialed cross-origin call.
      origin: (origin) => (origin && getAllowedOrigins().has(origin) ? origin : undefined),
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      credentials: true // required since client sends credentials: 'include'
    }),
    new RequestHeadersPlugin(),
    new SimpleCsrfProtectionHandlerPlugin(),
    new BodyLimitPlugin({
      maxBodySize: 10 * 1024 * 1024 // 10MB
    })
  ],
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ]
})

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event)

  // Resolve the session once per request and inject it into the ORPC context.
  // This means individual routers no longer need to call auth themselves, and
  // unauthenticated requests can be rejected centrally here or per-procedure.
  const session = await serverAuth.api.getSession({ headers: request.headers })

  const context: APiContext = {
    session,
    // reqHeaders is consumed by RequestHeadersPlugin (used by account router
    // when it calls auth.api.changePassword with the original request headers)
    reqHeaders: request.headers
  }

  const { matched, response } = await handler.handle(request, {
    prefix: "/rpc",
    context
  })

  if (matched) {
    return response
  }

  setResponseStatus(event, 404, "Not Found")
  return "Not found"
})
