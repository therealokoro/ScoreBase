/* This file contains reusable queries for term operations */
import { db } from "@nuxthub/db"
import { eq, and, asc } from "drizzle-orm"

import { terms } from "../db/schema"
/** Find a term by id or name within a session */
export const fetchSingleTerm = async (
  payload: string,
  column: "id" | "name" = "id",
  sessionId?: string
) => {
  const whereConditions = [eq(terms[column], payload)]
  if (sessionId) {
    whereConditions.push(eq(terms.sessionId, sessionId))
  }
  return await db.query.terms.findFirst({
    where: and(...whereConditions)
  })
}

/** Fetch all terms in a session, ordered by position */
export const fetchTermsBySession = async (sessionId: string) => {
  return await db.query.terms.findMany({
    where: eq(terms.sessionId, sessionId),
    orderBy: asc(terms.position)
  })
}

export const resolveNextTerm = async (
  sessionId: string
): Promise<{ name: string; position: number } | null> => {
  const preset = await getTermPreset() // reads from KV (or fallback)
  const existing = await fetchTermsBySession(sessionId)
  const usedPositions = new Set(existing.map((t) => t.position))

  for (let i = 0; i < preset.length; i++) {
    const position = i + 1
    if (!usedPositions.has(position)) {
      return { name: preset[i]!, position }
    }
  }

  return null
}
