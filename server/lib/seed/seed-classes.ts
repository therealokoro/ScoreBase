import { db, schema } from "@nuxthub/db"
import { typeid } from "typeid-js"
import { classNames } from "~~/server/lib/seed/data"

export async function seedClasses(teachers: any[]) {
  console.log("🏫 Creating classes...")

  const records = classNames.map((name, i) => ({
    id: typeid("class").toString(),
    name,
    teacherId: teachers[i]?.id,
    subjectList: null
  }))

  await db.insert(schema.classes).values(records)

  console.log(`✓ ${records.length} classes created`)

  return records
}
