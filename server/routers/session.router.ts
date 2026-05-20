import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { academicSessionContract } from "../contracts/session.contract"
import { academicSessions, terms } from "../db/schema"
import { fetchSingleAcademicSession, listAllAcademicSessions } from "../queries/session.query"

const os = implement(academicSessionContract)

const listAcademicSessions = os.list.handler(async () => await listAllAcademicSessions())

const getSingleAcademicSession = os.getOne.handler(async ({ input, errors }) => {
  const academicSesison = await fetchSingleAcademicSession(input.id)
  if (!academicSesison) throw errors.NOT_FOUND()

  return academicSesison
})

const createAcademicSession = os.create.handler(async ({ input, errors }) => {
  const existingSession = await fetchSingleAcademicSession(input.name, "name")
  if (existingSession) throw errors.CONFLICT()

  const [academicSession] = await db.insert(academicSessions).values(input).returning()

  const termPreset = await getTermPreset()

  // Auto-create 1st term for this session
  await db
    .insert(terms)
    .values({ name: termPreset[0]!, sessionId: academicSession!.id, position: 1 })

  return academicSession!
})

const updateAcademicSession = os.update.handler(async ({ input, errors }) => {
  const existingSession = await fetchSingleAcademicSession(input.id)
  if (!existingSession) throw errors.NOT_FOUND()

  if (input.name !== existingSession.name) {
    const nameConflict = await fetchSingleAcademicSession(input.name, "name")
    if (nameConflict) throw errors.CONFLICT()
  }

  const [updatedSession] = await db
    .update(academicSessions)
    .set({ name: input.name })
    .where(eq(academicSessions.id, input.id))
    .returning()

  return updatedSession!
})

const removeAcademicSession = os.delete.handler(async ({ input, errors }) => {
  const existingSession = await fetchSingleAcademicSession(input.id)
  if (!existingSession) throw errors.NOT_FOUND()

  // check if the session contains terms
  const sessionTerms = await db.query.terms.findMany({
    where: eq(terms.sessionId, input.id)
  })

  // fail and exit delete call if there are terms
  if (sessionTerms.length > 0) {
    throw errors.PRECONDITION_FAILED()
  }

  await db.delete(academicSessions).where(eq(academicSessions.id, input.id))
  return { success: true }
})

export const academicSessionRouter = {
  list: listAcademicSessions,
  getOne: getSingleAcademicSession,
  create: createAcademicSession,
  update: updateAcademicSession,
  delete: removeAcademicSession
}
