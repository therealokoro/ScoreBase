import { getServerAuth } from "~~/server/utils/server-auth"

export default defineEventHandler((event) => {
  const auth = getServerAuth()
  return auth.handler(toWebRequest(event))
})
