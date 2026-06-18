import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import type { APiContext } from "../context"
import { teacherContract } from "../contracts/teacher.contract"
import { classes, user } from "../db/schema"
import { listStudentsByClass } from "../queries/student.query"
import { fetchTeachersClass, fetchSingleTeacher, listAllTeachers } from "../queries/teacher.query"
import { serverAuth } from "../utils/server-auth"

async function assignClassToTeacher(classId: string | undefined, userId: string) {
  let selectedClass: { id: string; name: string } | null = null
  if (classId) {
    const [assignedClass] = await db
      .update(classes)
      .set({ teacherId: userId })
      .where(eq(classes.id, classId))
      .returning()

    selectedClass = { name: assignedClass!.name, id: assignedClass!.id }
  }

  return selectedClass
}

// All procedures share the APiContext so `context.session` is available
// if you need to restrict any of these to admins in the future.
// access the logged in user via `context.session.user` and `.role` to get the role
const os = implement(teacherContract).$context<APiContext>()

const listTeachers = os.list.handler(async () => await listAllTeachers())

const getSingleTeacher = os.getOne.handler(async ({ input, errors }) => {
  const teacherRecord = await fetchSingleTeacher(input.id)
  if (!teacherRecord) throw errors.NOT_FOUND()
  return teacherRecord
})

const createTeacher = os.create.handler(async ({ input, errors }) => {
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
      data: { phoneNumber: input.phoneNumber }
    }
  })

  const selectedClass = await assignClassToTeacher(input.classId, newUser.id)

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

const updateTeacher = os.update.handler(async ({ input, errors }) => {
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

  await db
    .update(user)
    .set({ ...input })
    .where(eq(user.id, input.id))
    .returning()

  await assignClassToTeacher(input.classId, input.id)
})

const removeTeacher = os.delete.handler(async ({ input, errors }) => {
  const existingTeacher = await fetchSingleTeacher(input.id)
  if (!existingTeacher) throw errors.NOT_FOUND()

  await db.delete(user).where(eq(user.id, input.id))
  return { success: true }
})

const getTeachersClass = os.getClass.handler(async ({ input, errors }) => {
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
