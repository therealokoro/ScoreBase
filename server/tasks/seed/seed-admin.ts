import { serverAuth as auth } from "~~/server/utils/server-auth"

export default defineTask({
  meta: { name: "seed:admin" },
  async run() {
    console.log("🛡 Seeding admin...")

    const rc = useRuntimeConfig()
    const { user } = await auth.api.createUser({
      body: {
        email: rc.defaultAdminEmail,
        password: rc.defaultAdminPass,
        name: rc.defaultAdminName,
        role: "admin",
        data: { phoneNumber: rc.defaultAdminPhone }
      }
    })

    if (user) {
      return { result: "Success" }
    } else {
      return { result: "Error" }
    }
  }
})
