import { ORPCError, ValidationError } from "@orpc/server"
import * as z from "zod"
import type { APiContext } from "~~/server/context"

/**
 * A single oRPC client interceptor that logs every error escaping a procedure call, with structured
 * detail depending on what kind of error it is.
 *
 * - Zod v4 validation errors (bad input OR a handler returning something that fails `.output()`) are
 *   unwrapped into a real `z.ZodError` so we can log a human-readable summary (`z.prettifyError`)
 *   and a structured one (`z.flattenError`) instead of a raw ZodIssue[] dump.
 * - Any other error — an explicit `throw new ORPCError(...)`, or a plain JS error oRPC auto-wrapped
 *   into INTERNAL_SERVER_ERROR — is logged with its real stack trace via `.cause`.
 *
 * It never swallows or rewrites the error, only observes and rethrows, so it doesn't change any
 * response the client sees.
 *
 * Wire it in ONCE on the handler — not per router/procedure file:
 *
 * Const handler = new RPCHandler(apiRouter, { clientInterceptors: [loggingInterceptor], // ...your
 * existing plugins / interceptors })
 *
 * `clientInterceptors` wraps the actual procedure execution for every procedure in the router, no
 * matter how many separate contract/router files were merged to build it — so adding/removing this
 * is a one-line, one-file change.
 */
export const loggingInterceptor = async (options: {
  context: APiContext
  path: readonly string[]
  input: unknown
  next: () => Promise<unknown>
}) => {
  try {
    return await options.next()
  } catch (error) {
    logProcedureError({
      error,
      path: options.path,
      input: options.input,
      context: options.context
    })
    throw error
  }
}

function logProcedureError(params: {
  error: unknown
  path: readonly string[]
  input: unknown
  context: APiContext
}) {
  const { error, path, input, context } = params

  const procedure = path.join(".")
  // Adjust this if your session shape differs (e.g. better-auth's
  // getSession() typically resolves to `{ session, user } | null`).
  const userId = context?.session?.user?.id ?? "anonymous"
  const timestamp = new Date().toISOString()
  const base = { timestamp, userId, procedure, input }

  // --- Zod v4 validation errors (input OR output) -------------------------
  if (error instanceof ORPCError && error.cause instanceof ValidationError) {
    const kind = error.code === "BAD_REQUEST" ? "input" : "output"

    // Safe to cast: ValidationError#issues is a ZodIssue[] when the schema
    // is a Zod schema, which is the only validator this app uses.
    const zodError = new z.ZodError(error.cause.issues as z.core.$ZodIssue[])

    console.error(`[orpc] ${kind} validation failed: ${procedure}`, {
      ...base,
      kind,
      // multi-line, human-readable — great for the terminal
      pretty: z.prettifyError(zodError),
      // formErrors + fieldErrors — great for shipping to a log aggregator
      flattened: z.flattenError(zodError)
    })
    return
  }

  // --- Explicit ORPCError (thrown deliberately, or auto-wrapped) ----------
  if (error instanceof ORPCError) {
    console.error(`[orpc] ${error.code} in ${procedure}`, {
      ...base,
      code: error.code,
      status: error.status,
      message: error.message,
      data: error.data,
      // When oRPC auto-wraps an unexpected `throw new Error(...)` into
      // INTERNAL_SERVER_ERROR, the original error is preserved here.
      cause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
              stack: error.cause.stack
            }
          : error.cause
    })
    return
  }

  // --- Anything oRPC didn't normalize into an ORPCError (rare) -------------
  console.error(`[orpc] unhandled error in ${procedure}`, {
    ...base,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error
  })
}
