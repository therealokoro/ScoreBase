import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"
import type { serverAuth } from "~~/server/utils/server-auth"

type AuthClient = ReturnType<typeof createAuthClient>
type UseSessionFn = AuthClient["useSession"]
type SessionAtom = UseSessionFn extends {
  (): infer R
  (useFetch: any): any
}
  ? R
  : never

let _authClient: AuthClient | undefined
let _sessionAtom: SessionAtom | undefined

function getAuthClient() {
  if (!_authClient) {
    const rc = useRuntimeConfig()
    // @ts-ignore - pnpm module resolution causes duplicate type conflict
    _authClient = createAuthClient({
      baseURL: rc.public.betterAuthUrl as string,
      plugins: [adminClient(), inferAdditionalFields<typeof serverAuth>()]
    })
    _sessionAtom = (_authClient!.useSession as UseSessionFn)() as SessionAtom
  }
  return { client: _authClient!, sessionAtom: _sessionAtom! }
}

export function useAuth() {
  const { client: authClient, sessionAtom } = getAuthClient()

  const data = computed(() => sessionAtom.value.data ?? null)
  const currentUser = computed(() => data.value?.user ?? null)
  const user = computed(() => data.value!.user)
  const session = computed(() => data.value?.session ?? null)
  const isLoggedIn = computed(() => data.value !== null)
  const isPending = computed(() => sessionAtom.value.isPending)
  const error = computed(() => sessionAtom.value.error ?? null)
  const isAdmin = computed(() => currentUser.value && currentUser.value.role == "admin")

  // Waits until better-auth has both finished loading AND written session data.
  // isPending going false does NOT guarantee data is populated — the atom can
  // briefly be { isPending: false, data: null } between the fetch completing
  // and the reactive write landing. This helper waits for both conditions.
  async function waitForSession() {
    if (!isPending.value) return
    await new Promise<void>((resolve) => {
      const stop = watch(
        isPending,
        (pending) => {
          if (!pending) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  async function refresh() {
    await sessionAtom.value.refetch?.()
    // After refetch, wait for isPending to settle so callers can immediately
    // read isLoggedIn and get the correct value
    await waitForSession()
  }

  return {
    data,
    currentUser,
    user,
    session,
    isLoggedIn,
    isPending,
    isAdmin,
    error,
    waitForSession,
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
