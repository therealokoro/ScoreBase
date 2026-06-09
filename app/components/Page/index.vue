<script setup lang="ts">
import { normalizeClass } from "vue"

import { ICONS } from "#shared/constants/icons"

const { crumbs } = useBreadcrumbs({ root: "/dashboard" })
const router = useRouter()

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Show the loader manually e.g. while fetching data */
    loading?: boolean
    /** Pass an error manually e.g. from useFetch */
    error?: Error | null
    class?: string
    badge?: string
    /** Show an empty state instead of the page slot */
    empty?: boolean
    /** Message shown in the empty state */
    emptyMessage?: string
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    emptyMessage: "Nothing to show here yet."
  }
)

useHead(() => ({
  title: props.title ? `${props.title} | ScoreBase` : "ScoreBase"
}))

const { isLoading: isPageLoading } = useLoadingIndicator()
const nuxtError = useError()

// Only show the loader on the initial page mount, not on subsequent navigations,
// to avoid replacing visible content with a spinner on every route change.
// const isMounted = ref(false)
// onMounted(() => {
//   isMounted.value = true
// })
const isLoading = computed(() => isPageLoading.value || props.loading)
// const isLoading = computed(() => (!isMounted.value && isPageLoading.value) || props.loading)

// Prop error takes priority, then Nuxt's app-level error
const activeError = computed(() => props.error ?? nuxtError.value ?? null)
const hasError = computed(() => activeError.value !== null)

// Show statusCode if available (from createError)
const errorCode = computed(() => (activeError.value as any)?.statusCode ?? null)
const errorMessage = computed(
  () => activeError.value?.message || "An unexpected error occurred. Please try again."
)

// Only show Go Back if there's actually somewhere to go back to
const canGoBack = computed(() => !!router.options.history.state.back)

const styles = tv({ base: "flex items-start gap-3" })
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <ClientOnly>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UiLoader class="size-10" text="Loading Content..." />
      </div>
    </ClientOnly>

    <!-- Error State -->
    <div
      v-if="!isLoading && hasError"
      class="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div class="flex items-center justify-center size-12 rounded-full bg-destructive/10">
        <Icon :name="ICONS.error" class="size-5 text-destructive" />
      </div>
      <div class="space-y-1 max-w-sm">
        <ui-heading :level="2" class="text-base font-semibold">
          {{ errorCode ? `Error ${errorCode}` : "Something went wrong" }}
        </ui-heading>
        <p class="text-sm text-foreground/80">{{ errorMessage }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UiButton
          v-if="canGoBack"
          variant="outline"
          :icon="ICONS.previous"
          @click="clearError({ redirect: router.options.history.state.back as string })"
        >
          Go Back
        </UiButton>
        <UiButton
          variant="outline"
          :icon="ICONS.home"
          @click="clearError({ redirect: '/dashboard' })"
        >
          Go Home
        </UiButton>
      </div>
    </div>

    <!-- Page Content -->
    <div v-else-if="!isLoading && !hasError" class="grid w-full gap-6">
      <div class="flex items-center gap-2">
        <!-- Quick Navigation Buttons -->
        <ui-button-group>
          <ui-button
            @click="router.go(-1)"
            class="text-muted-foreground"
            :icon="ICONS.previous"
            variant="ghost"
            size="icon-sm"
          />
          <ui-button
            @click="router.go(1)"
            class="text-muted-foreground"
            :icon="ICONS.next"
            variant="ghost"
            size="icon-sm"
          />
        </ui-button-group>

        <!-- Breadcrumb -->
        <UiBreadcrumbs v-if="crumbs.length" :items="crumbs" class="text-xs md:text-sm" />
      </div>

      <!-- Page Header -->
      <div :class="styles({ class: normalizeClass(props.class) || undefined })">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <ui-heading :level="1" class="text-2xl font-semibold tracking-tight">
              {{ title }}
            </ui-heading>
            <UiBadge v-if="badge" class="font-medium bg-primary/5 text-primary">
              {{ badge }}
            </UiBadge>
          </div>
          <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
        </div>
        <slot name="actions" />
      </div>

      <!-- Empty State -->
      <div v-if="empty" class="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div class="flex items-center justify-center size-12 rounded-full bg-muted">
          <Icon :name="ICONS.empty" class="size-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground max-w-xs">
          <slot name="empty">{{ emptyMessage }}</slot>
        </p>
      </div>

      <!-- Page Slot -->
      <slot v-else />
    </div>
  </div>
</template>
