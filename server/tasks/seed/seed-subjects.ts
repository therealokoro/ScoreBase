// server/tasks/seed/subjects.ts
import { db } from "@nuxthub/db"
import { SUBJECTS } from "~~/server/lib/seed-data"

import { subjects, subjectLists } from "../../db/schema"

// ─── Seed Task ────────────────────────────────────────────────────────────────

export default defineTask({
  meta: {
    name: "seed:subjects-and-subject-lists",
    description: "Seed Nigerian secondary school subjects and subject list presets"
  },
  async run() {
    console.log("🌱 Seeding subjects...")

    // Insert all subjects and return their generated ids
    const inserted = await db
      .insert(subjects)
      .values(SUBJECTS)
      .onConflictDoNothing()
      .returning({ id: subjects.id, name: subjects.name, tags: subjects.tags })

    console.log(`✅ Inserted ${inserted.length} subjects`)

    // Helper to pick subjects by exact names
    const byName = (...names: string[]) =>
      inserted.filter((s) => names.includes(s.name)).map((s) => ({ id: s.id, name: s.name }))

    // ─── Subject List Presets ───────────────────────────────────────────────

    console.log("🌱 Seeding subject list presets...")

    const core = byName("English Language", "Mathematics", "Civic Education", "Computer Studies")

    const presets = [
      {
        name: "Science Class (Core + Sciences)",
        subjects: [
          ...core,
          ...byName(
            "Biology",
            "Chemistry",
            "Physics",
            "Further Mathematics",
            "Agricultural Science"
          )
        ]
      },
      {
        name: "Arts Class (Core + Arts)",
        subjects: [
          ...core,
          ...byName(
            "Literature in English",
            "Government",
            "History",
            "Christian Religious Studies",
            "Fine Art"
          )
        ]
      },
      {
        name: "Commercial Class (Core + Commerce)",
        subjects: [
          ...core,
          ...byName(
            "Financial Accounting",
            "Commerce",
            "Economics",
            "Book Keeping",
            "Office Practice"
          )
        ]
      },
      {
        name: "Technical Class (Core + Technical)",
        subjects: [
          ...core,
          ...byName(
            "Basic Technology",
            "Technical Drawing",
            "Physics",
            "Further Mathematics",
            "Agricultural Science"
          )
        ]
      },
      {
        name: "JSS General (Junior Secondary)",
        subjects: [
          ...core,
          ...byName(
            "Basic Technology",
            "Home Economics",
            "Agricultural Science",
            "Social Studies",
            "Christian Religious Studies",
            "Physical and Health Education",
            "Fine Art",
            "Music"
          )
        ]
      }
    ]

    const insertedPresets = await db
      .insert(subjectLists)
      .values(presets)
      .onConflictDoNothing()
      .returning({ id: subjectLists.id, name: subjectLists.name })

    console.log(`✅ Inserted ${insertedPresets.length} subject list presets`)

    return {
      result: {
        subjects: inserted.length,
        presets: insertedPresets.length
      }
    }
  }
})
