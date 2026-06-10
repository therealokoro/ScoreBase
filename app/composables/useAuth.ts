import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/vue"
import type { serverAuth } from "~~/server/utils/server-auth"

type AuthClient = ReturnType<typeof createAuthClient>
type UseSessionFn = AuthClient["useSession"]
type SessionAtom = UseSessionFn extends {
  (): infer R // zero-arg overload → DeepReadonly<Ref<...>>
  (useFetch: any): any // useFetch overload  → Promise<...> (ignored)
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
