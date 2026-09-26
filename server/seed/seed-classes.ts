import { db, schema } from "@nuxthub/db"
import { eq } from "drizzle-orm"
import { typeid } from "typeid-js"
import { classNames } from "~~/server/seed/data"

export async function seedClasses(teachers: any[]) {
  console.log("🏫 Creating classes...")

  const records = classNames.map((name, i) => ({
    id: typeid("class").toString(),
    name,
    teacherId: teachers[i]?.id,
    subjectList: null
  }))

  await db.insert(schema.classes).values(records)

  // Keep the two sources of truth in sync: teacher scoping reads `user.classId`,
  // so a seeded teacher must have it set (previously left null → empty class views).
  await Promise.all(
    records.map((cls, i) => {
      const teacherId = teachers[i]?.id
      if (!teacherId || !cls.teacherId) return Promise.resolve()
      return db.update(schema.user).set({ classId: cls.id }).where(eq(schema.user.id, teacherId))
    })
  )

  console.log(`✓ ${records.length} classes created`)

  return records
}
