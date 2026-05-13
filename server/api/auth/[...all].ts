import { getServerAuth } from "~~/server/utils/auth";

export default defineEventHandler((event) => {
  const auth = getServerAuth();
  return auth.handler(toWebRequest(event));
});
