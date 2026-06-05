import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"
import type { getServerAuth } from "~~/server/utils/server-auth"

// @ts-ignore - pnpm module resolution causes duplicate type conflict
let _authClient: ReturnType<typeof createAuthClient> | undefined

function getAuthClient() {
  if (!_authClient) {
    const rc = useRuntimeConfig()
    // @ts-ignore
    _authClient = createAuthClient({
      baseURL: rc.public.betterAuthUrl,
      plugins: [adminClient(), inferAdditionalFields<ReturnType<typeof getServerAuth>>()]
    })
  }
  return _authClient!
}

export function useAuth() {
  const authClient = getAuthClient()
  const sessionAtom = authClient.useSession()
  const data = computed(() => sessionAtom.value.data ?? null)

  const currentUser = computed(() => data.value?.user ?? null)
  const user = computed(() => data.value!.user)
  const session = computed(() => data.value?.session ?? null)
  const isLoggedIn = computed(() => data.value !== null)
  const isPending = computed(() => sessionAtom.value.isPending)
  const error = computed(() => sessionAtom.value.error ?? null)
  async function refresh() {
    await sessionAtom.value.refetch?.()
  }

  return {
    data,
    currentUser,
    user,
    session,
    isLoggedIn,
    isPending,
    error,
    refresh,
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    signOut: authClient.signOut,
    getSession: authClient.getSession,
    changePassword: authClient.changePassword,
    deleteUser: authClient.deleteUser,
    client: authClient
  }
}
