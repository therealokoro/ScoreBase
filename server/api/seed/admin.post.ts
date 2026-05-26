export default defineEventHandler(async () => {
  try {
    const auth = getServerAuth()
    const rc = useRuntimeConfig()

    const { user } = await auth.api.createUser({
      body: {
        email: rc.nuxtDefaultAdminEmail,
        password: rc.nuxtDefaultAdminPass,
        name: "Administrator",
        role: "admin",
        data: { phoneNumber: "00000000000" }
      }
    })

    return `${user.name} created with ${user.email} email address ✅`
  } catch (error: any) {
    throw createError(error)
  }
})
