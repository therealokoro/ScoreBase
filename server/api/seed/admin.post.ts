import { serverAuth as auth } from "~~/server/utils/server-auth"

export default defineEventHandler(async () => {
  try {
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

    return `${user.name} created with ${user.email} email address ✅`
  } catch (error: any) {
    throw createError(error)
  }
})
