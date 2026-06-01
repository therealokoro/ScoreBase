import { faker } from "@faker-js/faker"
import { classes, students } from "hub:db:schema"
import { typeid } from "typeid-js"
import {
  nigerianFirstNames,
  nigerianLastNames,
  numberPrefixes,
  classNames
} from "~~/server/lib/seed-data"
import { getServerAuth } from "~~/server/utils/server-auth"

// Nigerian first names and last names pools

function nigerianName() {
  const first = faker.helpers.arrayElement(nigerianFirstNames)
  const last = faker.helpers.arrayElement(nigerianLastNames)
  return `${first} ${last}`
}

function nigerianPhone() {
  // Nigerian mobile numbers: 070, 080, 081, 090, 091 + 8 digits
  const prefix = faker.helpers.arrayElement(numberPrefixes)
  const rest = faker.string.numeric(7)
  return `${prefix}${rest}`
}

const STUDENTS_PER_CLASS = 30

export default defineTask({
  meta: {
    name: "seed:students-and-classes",
    description: "Run database seed"
  },
  async run() {
    console.log("🌱 Seeding database...")

    // ── 1. Seed Teachers (one per class) ────────────────────────────────────
    console.log("👨‍🏫 Creating teachers...")

    const usedPhones = new Set<string>()
    const usedEmails = new Set<string>()

    function uniquePhone() {
      let phone: string
      do {
        phone = nigerianPhone()
      } while (usedPhones.has(phone))
      usedPhones.add(phone)
      return phone
    }

    function uniqueEmail(name: string) {
      const base = name.toLowerCase().replace(/\s+/g, ".")
      let email = `${base}@gmail.com`
      let i = 1
      while (usedEmails.has(email)) {
        email = `${base}${i}@gmail.com`
        i++
      }
      usedEmails.add(email)
      return email
    }

    const auth = getServerAuth()

    const teacherDrafts = classNames.map(() => {
      const name = nigerianName()
      const surname = name.split(" ")[1]!
      return {
        name,
        email: uniqueEmail(name),
        password: `pass-${surname.toLowerCase()}-123`,
        phoneNumber: uniquePhone()
      }
    })

    const teacherRecords = await Promise.all(
      teacherDrafts.map((draft) =>
        auth.api
          .createUser({
            body: {
              name: draft.name,
              email: draft.email,
              password: draft.password,
              role: "user",
              data: {
                phoneNumber: draft.phoneNumber,
                emailVerified: true
              }
            }
          })
          .then((res) => ({ ...res.user, phoneNumber: draft.phoneNumber }))
      )
    )

    console.log(`   ✓ ${teacherRecords.length} teachers created`)

    // ── 2. Seed Classes ──────────────────────────────────────────────────────
    console.log("🏫 Creating classes...")

    const classRecords = classNames.map((className, i) => ({
      id: typeid("class").toString(),
      name: className,
      teacherId: teacherRecords[i]?.id,
      subjectList: null
    }))

    await db.insert(classes).values(classRecords)
    console.log(`   ✓ ${classRecords.length} classes created`)

    // ── 3. Seed Students ─────────────────────────────────────────────────────
    console.log("👩‍🎓 Creating students...")

    let studentCounter = 1
    const studentRecords = classRecords.flatMap((cls) =>
      Array.from({ length: STUDENTS_PER_CLASS }, () => {
        const paddedNum = String(studentCounter++).padStart(4, "0")
        return {
          id: typeid("stu").toString(),
          name: nigerianName(),
          studentId: `STU-2026-${paddedNum}`,
          classId: cls.id,
          phoneNumber: faker.datatype.boolean(0.6) ? uniquePhone() : null
        }
      })
    )

    // Insert in chunks to avoid SQLite variable limit
    const CHUNK = 50
    for (let i = 0; i < studentRecords.length; i += CHUNK) {
      await db.insert(students).values(studentRecords.slice(i, i + CHUNK))
    }
    console.log(`   ✓ ${studentRecords.length} students created`)

    console.log("\n✅ Seeding complete!")
    console.log(`   Classes : ${classRecords.length}`)
    console.log(`   Teachers: ${teacherRecords.length}`)
    console.log(`   Students: ${studentRecords.length}`)

    return { result: "Success" }
  }
})
