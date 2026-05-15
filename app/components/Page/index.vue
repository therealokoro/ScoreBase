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

useState("pageTitle", () => props.title)

useHead(() => ({
  title: props.title ? `${props.title} | ScoreBase` : "ScoreBase"
}))

const hasError = computed(() => props.error !== null)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Page Header -->
    <!-- <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div> -->

    <!-- Loading State -->
    <div v-if="loading && !hasError" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <UiLoader />
        <span class="text-sm text-muted-foreground">Loading...</span>
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
