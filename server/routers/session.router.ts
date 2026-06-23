import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { academicSessionContract } from "../contracts/session.contract"
import { academicSessions, terms } from "../db/schema"
import { getSchoolSettings, getTermPreset } from "../kv/school-settings"
import { fetchSingleAcademicSession, listAllAcademicSessions } from "../queries/session.query"

export function generateNextSessionName(sessions: { name: string }[], suffix = ""): string {
  if (sessions.length === 0) {
    const year = new Date().getFullYear()
    return suffix ? `${year}/${year + 1} ${suffix}` : `${year}/${year + 1}`
  }

  const highestYear = Math.max(
    ...sessions.map((s) => {
      const match = s.name.match(/^(\d{4})\/\d{4}/)
      if (!match) {
        throw new Error(`Invalid session format: ${s.name}`)
      }
      return Number(match[1])
    })
  )

  const nextYear = highestYear + 1
  return suffix ? `${nextYear}/${nextYear + 1} ${suffix}` : `${nextYear}/${nextYear + 1}`
}

const os = implement(academicSessionContract)

const listAcademicSessions = os.list.handler(async () => await listAllAcademicSessions())

const getSingleAcademicSession = os.getOne.handler(async ({ input, errors }) => {
  const academicSesison = await fetchSingleAcademicSession(input.id)
  if (!academicSesison) throw errors.NOT_FOUND()

  return academicSesison
})

const createAcademicSession = os.create.handler(async () => {
  // list sessions
  const allSessions = await listAllAcademicSessions()
  // extract existing session names
  const sessionNames = allSessions.map((curr: IAcademicSession) => ({ name: curr.name }))
  // get session suffix and generate next session name
  const sessionSuffix = await getSchoolSettings("sessionSuffix")
  const nextSession = generateNextSessionName(sessionNames, sessionSuffix)

  // store session
  const [academicSession] = await db
    .insert(academicSessions)
    .values({ name: nextSession })
    .returning()

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
