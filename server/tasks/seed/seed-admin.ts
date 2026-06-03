export default defineTask({
  meta: { name: "seed:admin" },
  async run() {
    console.log("🛡 Seeding admin...")
    const auth = getServerAuth()

    const rc = useRuntimeConfig()
    const { user } = await auth.api.createUser({
      body: {
        email: rc.defaultAdminEmail,
        password: rc.defaultAdminPass,
        name: rc.defaultAdminName,
        data: {
          phoneNumber: rc.defaultAdminPhone
        }
      }
    })

    if (user) {
      return { result: "Success" }
    } else {
      return { result: "Error" }
    }
  }
})
