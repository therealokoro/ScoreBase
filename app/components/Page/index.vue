<script setup lang="ts">
import { ICONS } from "#shared/constants/icons"

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    loading?: boolean
    error?: Error | null
  }>(),
  {
    loading: false,
    error: null
  }
)

// Set page title to be reused in dashboard layout
useState<string>("pageTitle", () => props.title)

useHead(() => ({
  title: props.title ? `${props.title} | ScoreBase` : "ScoreBase"
}))

const hasError = computed(() => props.error !== null)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div class="space-y-1">
        <ui-heading :level="1" class="text-2xl font-semibold tracking-tight">
          {{ title }}
        </ui-heading>
        <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      </div>

      <slot name="toolbar" />
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasError" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <UiLoader class="size-10" text="Loading Content..." />
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="hasError" variant="destructive" class="max-w-md">
      <Icon :name="ICONS.error" class="size-4" />
      <template #title>Error</template>
      <template #description>
        {{ error?.message || "An unexpected error occurred. Please try again." }}
      </template>
    </UiAlert>

    <!-- Page Content -->
    <slot v-else />
  </div>
</template>
