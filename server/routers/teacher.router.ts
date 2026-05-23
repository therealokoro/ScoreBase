import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { teacherContract } from "../contracts/teacher.contract"
import { user } from "../db/schema"
import { fetchSingleTeacher, listAllTeachers } from "../queries/teacher.query"

const os = implement(teacherContract)

const listTeachers = os.list.handler(async () => await listAllTeachers())

const getSingleTeacher = os.getOne.handler(async ({ input, errors }) => {
  const teacherRecord = await fetchSingleTeacher(input.id)
  if (!teacherRecord) throw errors.NOT_FOUND()
  return teacherRecord
})

const createTeacher = os.create.handler(async ({ input, errors }) => {
  // Check for name conflict
  const existingTeacher = await fetchSingleTeacher(input.name)
  if (existingTeacher) throw errors.CONFLICT()

  const auth = getServerAuth()
  const { user } = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: input.phoneNumber,
      data: { phoneNumber: input.phoneNumber }
    }
  })

  return {
    id: user.id,
    name: user.name,
    role: user.role!,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    phoneNumber: input.phoneNumber
  }
})

const updateTeacher = os.update.handler(async ({ input, errors }) => {
  const existingTeacher = await fetchSingleTeacher(input.id)
  if (!existingTeacher) throw errors.NOT_FOUND()

  // Check email conflict if email changed
  if (input.email !== existingTeacher.email) {
    const emailExist = await db.query.user.findFirst({ where: eq(user.email, input.email) })
    if (emailExist) throw errors.CONFLICT({ message: "This email is already taken" })
  }

  // Check phoneNumber conflict if phoneNumber changed
  if (input.phoneNumber !== existingTeacher.phoneNumber) {
    const phoneNoExist = await db.query.user.findFirst({
      where: eq(user.phoneNumber, input.phoneNumber)
    })
    if (phoneNoExist) throw errors.CONFLICT({ message: "This phone number is already taken" })
  }

  const [updatedTeacher] = await db
    .update(user)
    .set({ ...input })
    .where(eq(user.id, input.id))
    .returning()

  return updatedTeacher!
})

const removeTeacher = os.delete.handler(async ({ input, errors }) => {
  const existingTeacher = await fetchSingleTeacher(input.id)
  if (!existingTeacher) throw errors.NOT_FOUND()

  const auth = getServerAuth()
  await auth.api.removeUser({ body: { userId: input.id } })

  return { success: true }
})

export const teacherRouter = {
  list: listTeachers,
  getOne: getSingleTeacher,
  create: createTeacher,
  update: updateTeacher,
  delete: removeTeacher
}
