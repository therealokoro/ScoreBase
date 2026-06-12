import { faker } from "@faker-js/faker"
import { db, schema } from "@nuxthub/db"
import { typeid } from "typeid-js"

import { nigerianName } from "./helpers"

const STUDENTS_PER_CLASS = 30
const CHUNK_SIZE = 50

export async function seedStudents(classRecords: any[], uniquePhone: () => string) {
  console.log("👩‍🎓 Creating students...")

  let studentCounter = 1
  const records = classRecords.flatMap((cls) =>
    Array.from({ length: STUDENTS_PER_CLASS }, () => {
      const seq = String(studentCounter++).padStart(4, "0")

      return {
        id: typeid("stu").toString(),
        studentId: `STU-2026-${seq}`,
        name: nigerianName(),
        classId: cls.id,
        phoneNumber: faker.datatype.boolean(0.6) ? uniquePhone() : null
      }
    })
  )

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    await db.insert(schema.students).values(records.slice(i, i + CHUNK_SIZE))
  }

  console.log(`✓ ${records.length} students created`)

  return records
}
