import { onError } from "@orpc/server"
import { RPCHandler, BodyLimitPlugin } from "@orpc/server/fetch"
import { CORSPlugin, SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins"
import { apiRouter } from "~~/server/routers"

const handler = new RPCHandler(apiRouter, {
  plugins: [
    new CORSPlugin({
      origin: (origin) => origin, // reflect origin — tighten this in production
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      credentials: true // required since client sends credentials: 'include'
    }),
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
  const { matched, response } = await handler.handle(request, {
    prefix: "/rpc"
  })

  if (matched) {
    return response
  }

  setResponseStatus(event, 404, "Not Found")
  return "Not found"
})
