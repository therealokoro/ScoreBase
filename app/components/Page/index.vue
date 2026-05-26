<script setup lang="ts">
import { normalizeClass } from "vue"

import { ICONS } from "#shared/constants/icons"
const { crumbs } = useBreadcrumbs({ root: "/admin" })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    loading?: boolean
    error?: Error | null
    class?: string
  }>(),
  {
    loading: false,
    error: null
  }
)

// set page title for use in dashboard
const pageTitle = useState("pageTitle", () => props.title)
watch(
  () => props.title,
  (val) => {
    pageTitle.value = val
  }
)

useHead(() => ({
  title: props.title ? `${props.title} | ScoreBase` : "ScoreBase"
}))

const hasError = computed(() => props.error !== null)

const styles = tv({ base: "flex items-start gap-3" })
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UiLoader class="size-10" text="Loading Content..." />
    </div>

    <!-- Error State -->
    <div
      v-else-if="hasError"
      class="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div class="flex items-center justify-center size-12 rounded-full bg-destructive/10">
        <Icon :name="ICONS.error" class="size-5 text-destructive" />
      </div>
      <div class="space-y-1 max-w-sm">
        <ui-heading :level="2" class="text-base font-semibold">Something went wrong</ui-heading>
        <p class="text-sm text-foreground/80">
          {{ error?.message || "An unexpected error occurred. Please try again." }}
        </p>
      </div>
      <UiButton variant="outline" to="/admin" :icon="ICONS.home">Go Back</UiButton>
    </div>

    <!-- Page Content -->
    <div v-else class="grid w-full gap-6">
      <!-- Breadcrumb -->
      <UiBreadcrumbs v-if="crumbs.length" :items="crumbs" />

      <!-- Actual Page -->
      <div :class="styles({ class: normalizeClass(props.class) || undefined })">
        <div class="space-y-1">
          <ui-heading :level="1" class="text-2xl font-semibold tracking-tight">
            {{ title }}
          </ui-heading>
          <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
        </div>
        <slot name="actions" />
      </div>

      <slot />
    </div>
  </div>
</template>
