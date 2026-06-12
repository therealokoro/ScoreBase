import { createUniqueGenerators, seedClasses, seedStudents, seedTeachers } from "../../lib/seed"

export default defineTask({
  meta: {
    name: "seed:students-teachers-and-classes",
    description: "Run database seed"
  },

  async run() {
    console.log("🌱 Seeding database...")

    const { uniqueEmail, uniquePhone } = createUniqueGenerators()

    const teachers = await seedTeachers(uniqueEmail, uniquePhone)
    const classes = await seedClasses(teachers)
    const students = await seedStudents(classes, uniquePhone)

    console.log("\n✅ Seeding complete!")
    console.log(`Classes: ${classes.length}`)
    console.log(`Teachers: ${teachers.length}`)
    console.log(`Students: ${students.length}`)

    return {
      result: "Success",
      details: {
        Classes: classes.length,
        Teachers: teachers.length,
        Students: students.length
      }
    }
  }
})
