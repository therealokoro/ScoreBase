import { onError } from "@orpc/server"
import { RPCHandler, BodyLimitPlugin } from "@orpc/server/fetch"
import {
  CORSPlugin,
  RequestHeadersPlugin,
  SimpleCsrfProtectionHandlerPlugin
} from "@orpc/server/plugins"
import type { APiContext } from "~~/server/context"
import { apiRouter } from "~~/server/routers"
import { serverAuth } from "~~/server/utils/server-auth"

const handler = new RPCHandler(apiRouter, {
  plugins: [
    new CORSPlugin({
      origin: (origin) => origin, // reflect origin — tighten this in production
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
