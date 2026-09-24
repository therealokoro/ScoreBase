import { db } from "@nuxthub/db"
import { ORPCError, implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { teacherContract } from "../contracts/teacher.contract"
import { classes, user } from "../db/schema"
import { listStudentsByClass } from "../queries/student.query"
import { fetchTeachersClass, fetchSingleTeacher, listAllTeachers } from "../queries/teacher.query"
import { requireAdmin, requireSession } from "../utils/auth-guard"
import { serverAuth } from "../utils/server-auth"

/**
 * Keeps `user.classId` and `classes.teacherId` in sync for a single teacher.
 *
 * Clears any class previously pointing at this teacher first (the `classes.teacherId` unique index
 * would otherwise reject a move), unassigns any previous teacher of the target class, then writes
 * both sides. `classId === undefined` means "no class" on create; callers that mean "leave
 * unchanged" should not call this at all.
 */
async function syncTeacherClass(
  teacherId: string,
  classId: string | undefined
): Promise<{ id: string; name: string } | null> {
  // Clear the class currently assigned to this teacher (if any)
  await db.update(classes).set({ teacherId: null }).where(eq(classes.teacherId, teacherId))

  let selectedClass: { id: string; name: string } | null = null
  if (classId) {
    const target = await db.query.classes.findFirst({ where: eq(classes.id, classId) })
    if (!target) throw new ORPCError("NOT_FOUND", { message: "The class was not found" })

    // If the target class already has a different teacher, release that teacher.
    if (target.teacherId && target.teacherId !== teacherId) {
      await db.update(user).set({ classId: null }).where(eq(user.id, target.teacherId))
    }

    await db.update(classes).set({ teacherId }).where(eq(classes.id, classId))
    selectedClass = { id: target.id, name: target.name }
  }

  // Write the authoritative session-scoping field
  await db.update(user).set({ classId: classId ?? null }).where(eq(user.id, teacherId))

  return selectedClass
}

// All procedures share the APiContext so `context.session` is available.
// Admin-only procedures call `requireAdmin(context)`; teacher-facing
// procedures such as `getClass` stay ungated.
const os = implement(teacherContract).$context<APiContext>()

const listTeachers = os.list.handler(async ({ context }) => {
  requireAdmin(context)
  return await listAllTeachers()
})

const getSingleTeacher = os.getOne.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const teacherRecord = await fetchSingleTeacher(input.id)
  if (!teacherRecord) throw errors.NOT_FOUND()
  return teacherRecord
})

const createTeacher = os.create.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  // Use the singleton — no more re-initialization on every call
  const existingTeacher = await db.query.user.findFirst({
    where: (user, { eq, or }) =>
      or(eq(user.email, input.email), eq(user.phoneNumber, input.phoneNumber))
  })

  if (existingTeacher) throw errors.CONFLICT()

  const { user: newUser } = await serverAuth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: input.phoneNumber,
      role: "teacher" as "user" | "admin",
      data: { phoneNumber: input.phoneNumber, classId: input.classId }
    }
  })

  // `user.classId` is declared `input: false` in Better Auth, so createUser ignores
  // data.classId. Sync both sides explicitly so a new teacher's session is class-scoped.
  const selectedClass = await syncTeacherClass(newUser.id, input.classId)

  return {
    id: newUser.id,
    name: newUser.name,
    role: newUser.role!,
    email: newUser.email,
    createdAt: newUser.createdAt,
    phoneNumber: input.phoneNumber,
    class: selectedClass
  }
})

const updateTeacher = os.update.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const existingTeacher = await fetchSingleTeacher(input.id)
  if (!existingTeacher) throw errors.NOT_FOUND()

  if (input.email !== existingTeacher.email) {
    const emailExist = await db.query.user.findFirst({ where: eq(user.email, input.email) })
    if (emailExist) throw errors.CONFLICT({ message: "This email is already taken" })
  }

  if (input.phoneNumber !== existingTeacher.phoneNumber) {
    const phoneNoExist = await db.query.user.findFirst({
      where: eq(user.phoneNumber, input.phoneNumber)
    })
    if (phoneNoExist) throw errors.CONFLICT({ message: "This phone number is already taken" })
  }

  // classId is synced through syncTeacherClass (it owns both user.classId and
  // classes.teacherId); undefined means "leave the assignment unchanged".
  const { classId, ...rest } = input

  await db
    .update(user)
    .set({ ...rest })
    .where(eq(user.id, input.id))
    .returning()

  if (classId !== undefined) {
    await syncTeacherClass(input.id, classId)
  }
})

const removeTeacher = os.delete.handler(async ({ input, errors, context }) => {
  requireAdmin(context)

  const existingTeacher = await fetchSingleTeacher(input.id)
  if (!existingTeacher) throw errors.NOT_FOUND()

  await db.delete(user).where(eq(user.id, input.id))
  return { success: true }
})

const getTeachersClass = os.getClass.handler(async ({ input, errors, context }) => {
  requireSession(context)

  const teachersClass = await fetchTeachersClass(input.teacherId)
  if (!teachersClass) throw errors.NOT_FOUND()

  const studentCount = (await listStudentsByClass(teachersClass.id)).length
  const count = { students: studentCount.toString() }

  return { ...teachersClass, count }
})

export const teacherRouter = {
  list: listTeachers,
  getOne: getSingleTeacher,
  create: createTeacher,
  update: updateTeacher,
  delete: removeTeacher,
  getClass: getTeachersClass
}
