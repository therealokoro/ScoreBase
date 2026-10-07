import { blob } from "@nuxthub/blob"
import { createError, eventHandler, getRouterParam, setHeader } from "h3"

/**
 * Serves report card assets (logos and signatures) uploaded to NuxtHub Blob. Only the
 * `report-card/` prefix is served, so arbitrary stored blobs can never be exposed through this
 * route.
 */
export default eventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname")
  if (!pathname || !pathname.startsWith("report-card/")) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" })
  }

  // The upload helper always writes images; lock the response to image content so a stored
  // blob can never be served as HTML (XSS hardening).
  setHeader(event, "Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'")
  // Blob pathnames are deterministic (a re-upload overwrites the previous file), so caching
  // would keep showing the old image after a replacement.
  setHeader(event, "Cache-Control", "no-store")

  return blob.serve(event, pathname)
})
