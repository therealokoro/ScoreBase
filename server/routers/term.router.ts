import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { termContract } from "../contracts/term.contract"
import { terms, academicSessions } from "../db/schema"
import { fetchSingleTerm, listAllSessionTerms, resolveNextTerm } from "../queries/term.query"

const os = implement(termContract)

const listTerms = os.list.handler(({ input }) => {
  return listAllSessionTerms(input.sessionId)
})

const getSingleTerm = os.getOne.handler(async ({ input, errors }) => {
  const term = await fetchSingleTerm(input.id)
  if (!term) throw errors.NOT_FOUND()
  return term
})

const createTerm = os.create.handler(async ({ input, errors }) => {
  // 1. Check parent session exists
  const parentSession = await db.query.academicSessions.findFirst({
    where: eq(academicSessions.id, input.sessionId)
  })

  if (!parentSession) throw errors.NOT_FOUND()

  // 2. Auto-resolve the next available term
  const next = await resolveNextTerm(input.sessionId)
  if (!next) throw errors.CONFLICT() // all preset terms already created

  // 3. Insert with auto-determined name + position
  const [term] = await db
    .insert(terms)
    .values({
      name: next.name,
      position: next.position,
      sessionId: input.sessionId
    })
    .returning()

  return term!
})

const updateTerm = os.update.handler(async ({ input, errors }) => {
  const existingTerm = await fetchSingleTerm(input.id)
  if (!existingTerm) throw errors.NOT_FOUND()

  // Check name conflict if name changed
  if (input.name !== existingTerm.name) {
    const nameConflict = await fetchSingleTerm(input.name, "name", input.sessionId)
    if (nameConflict) throw errors.CONFLICT()
  }

  const [updatedTerm] = await db
    .update(terms)
    .set({ name: input.name })
    .where(eq(terms.id, input.id))
    .returning()

  return updatedTerm!
})

const removeTerm = os.delete.handler(async ({ input, errors }) => {
  const existingTerm = await fetchSingleTerm(input.id)
  if (!existingTerm) throw errors.NOT_FOUND()

  // TODO: Check for associated results/scoresheets
  // if (hasResults) throw errors.PRECONDITION_FAILED()

  await db.delete(terms).where(eq(terms.id, input.id))
  return { success: true }
})

export const termRouter = {
  list: listTerms,
  getOne: getSingleTerm,
  create: createTerm,
  update: updateTerm,
  delete: removeTerm
}
