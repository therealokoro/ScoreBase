import { serverAuth } from "~~/server/utils/server-auth"

export default defineEventHandler((event) => {
  return serverAuth.handler(toWebRequest(event))
})
