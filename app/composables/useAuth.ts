import { adminClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import type { getServerAuth } from "~~/server/utils/server-auth";

function getAuthClient() {
  const rc = useRuntimeConfig();
  return createAuthClient({
    baseURL: rc.public.betterAuthUrl,
    plugins: [adminClient(), inferAdditionalFields<typeof getServerAuth>()],
  });
}

type AuthClient = ReturnType<typeof getAuthClient>;
type SessionUser = NonNullable<
  NonNullable<Awaited<ReturnType<AuthClient["getSession"]>>["data"]>["user"]
>;
export type IUser = Omit<SessionUser, "image" | "emailVerified">;

export function useAuth() {
  const authClient = getAuthClient();
  const sessionAtom = authClient.useSession();
  const data = computed(() => sessionAtom.value.data ?? null);

  /**
   * The authenticated user object, or `null` when not signed in. Use this when you need to safely
   * check whether a user exists.
   *
   * @example
   *   <p v-if="auth.currentUser">Hello, {{ auth.currentUser.name }}</p>
   */
  const currentUser = computed<IUser | null>(() => data.value?.user ?? null);

  /**
   * The authenticated user object, **non-null asserted**. Only access this after confirming
   * `isLoggedIn` is true — in a template block guarded by `v-if="auth.isLoggedIn"`, or in a page
   * protected by `definePageMeta({ allow: 'user' })`.
   *
   * @example
   *   <template v-if="auth.isLoggedIn">
   *   <p>{{ auth.user.name }}</p>
   *   </template>
   */
  const user = computed<IUser>(() => data.value!.user);

  /** The raw better-auth session record (id, token, expiresAt, …), or `null`. */
  const session = computed(() => data.value?.session ?? null);

  /** `true` when a valid session exists. */
  const isLoggedIn = computed(() => data.value !== null);

  /** `true` while the initial session fetch is in-flight. */
  const isPending = computed(() => sessionAtom.value.isPending);

  /** The fetch error from the session request, or `null`. */
  const error = computed(() => sessionAtom.value.error ?? null);

  /**
   * Force-refresh the session from the server, bypassing the cookie cache
   *
   * @example
   *   await auth.refresh()
   */
  async function refresh() {
    await authClient.getSession({ query: { disableCookieCache: true } });
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    data,
    currentUser,
    user,
    session,
    isLoggedIn,
    isPending,
    error,

    refresh,

    // better-auth client methods — re-exported as-is so callers get full type support
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    signOut: authClient.signOut,
    getSession: authClient.getSession,
    changePassword: authClient.changePassword,
    deleteUser: authClient.deleteUser,
    client: authClient,
  };
}
