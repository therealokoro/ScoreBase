/* This file contains reusable queries for term operations */
import { db } from "@nuxthub/db";
import { eq, and } from "drizzle-orm";

import { terms } from "../db/schema";

/** Find a term by id or name within a session */
export const fetchSingleTerm = async (
  payload: string,
  column: "id" | "name" = "id",
  sessionId?: string,
) => {
  const whereConditions = [eq(terms[column], payload)];
  if (sessionId) {
    whereConditions.push(eq(terms.sessionId, sessionId));
  }
  return await db.query.terms.findFirst({
    where: and(...whereConditions),
  });
};

/** List all terms, filtered by sessionId */
export const listAllSessionTerms = async (sessionId: string) => {
  return await db.query.terms.findMany({
    where: eq(terms.sessionId, sessionId),
  });
};
