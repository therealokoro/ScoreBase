import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from "@tanstack/vue-query"
import type { DehydratedState } from "@tanstack/vue-query" // Import the type

import { useState, defineNuxtPlugin } from "#imports"

export default defineNuxtPlugin((nuxtApp) => {
  // Sync state between server and client
  const vueQueryState = useState<DehydratedState | null>("vue-query", () => null)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } }
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  // Dehydrate/Hydrate for SSR
  if (import.meta.server) {
    nuxtApp.hooks.hook("app:rendered", () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    nuxtApp.hooks.hook("app:created", () => {
      // Guard against a null dehydrated state
      if (vueQueryState.value) {
        hydrate(queryClient, vueQueryState.value)
      }
    })
  }
})
