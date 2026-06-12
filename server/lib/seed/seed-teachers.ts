import { classNames } from "~~/server/lib/seed/data"
import { serverAuth as auth } from "~~/server/utils/server-auth"

import { nigerianName } from "./helpers"

export async function seedTeachers(
  uniqueEmail: (name: string) => string,
  uniquePhone: () => string
) {
  console.log("👨‍🏫 Creating teachers...")

  const drafts = classNames.map(() => {
    const name = nigerianName()
    const surname = name.split(" ")[1]!

    return {
      name,
      email: uniqueEmail(name),
      password: `pass-${surname.toLowerCase()}-123`,
      phoneNumber: uniquePhone()
    }
  })

  const teachers = await Promise.all(
    drafts.map((draft) =>
      auth.api
        .createUser({
          body: {
            name: draft.name,
            email: draft.email,
            password: draft.password,
            role: "teacher" as "user" | "admin",
            data: {
              phoneNumber: draft.phoneNumber,
              emailVerified: true
            }
          }
        })
        .then((res) => ({
          ...res.user,
          phoneNumber: draft.phoneNumber
        }))
    )
  )

  console.log(`✓ ${teachers.length} teachers created`)

  return teachers
}
