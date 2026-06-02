import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { eq } from "drizzle-orm"

import { teacherContract } from "../contracts/teacher.contract"
import { classes, user } from "../db/schema"
import { listStudentsByClass } from "../queries/student.query"
import { fetchTeachersClass, fetchSingleTeacher, listAllTeachers } from "../queries/teacher.query"

async function assignClassToTeacher(classId: string | undefined, userId: string) {
  // Assign class to teacher if class is provided
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

const os = implement(teacherContract)

const listTeachers = os.list.handler(async () => await listAllTeachers())

const getSingleTeacher = os.getOne.handler(async ({ input, errors }) => {
  const teacherRecord = await fetchSingleTeacher(input.id)
  if (!teacherRecord) throw errors.NOT_FOUND()
  return teacherRecord
})

const createTeacher = os.create.handler(async ({ input, errors }) => {
  const auth = getServerAuth()

  // check if a user exist with either of the provided email or phone number
  const existingTeacher = await db.query.user.findFirst({
    where: (user, { eq, or }) =>
      or(eq(user.email, input.email), eq(user.phoneNumber, input.phoneNumber))
  })

  if (existingTeacher) throw errors.CONFLICT()

  // create the teacher using better-auth create user api since teachers are users
  const { user } = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: input.phoneNumber,
      data: { phoneNumber: input.phoneNumber }
    }
  })

  const selectedClass = await assignClassToTeacher(input.classId, user.id)

  return {
    id: user.id,
    name: user.name,
    role: user.role!,
    email: user.email,
    createdAt: user.createdAt,
    phoneNumber: input.phoneNumber,
    class: selectedClass
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
