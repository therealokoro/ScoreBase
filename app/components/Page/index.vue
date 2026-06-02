<script setup lang="ts">
import { normalizeClass } from "vue"

import { ICONS } from "#shared/constants/icons"

const { currentUser } = useAuth()
const path = computed(() => (currentUser.value?.role == "admin" ? "/admin" : "/teacher"))
const { crumbs } = useBreadcrumbs({ root: path.value })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    loading?: boolean
    error?: Error | null
    class?: string
    badge?: string
  }>(),
  {
    loading: false,
    error: null
  }
)

useHead(() => ({
  title: props.title ? `${props.title} | ScoreBase` : "ScoreBase"
}))

const hasError = computed(() => props.error !== null)

const styles = tv({ base: "flex items-start gap-3" })
</script>

<template>
  <ClientOnly>
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
        <div class="flex items-center gap-2">
          <ui-button-group>
            <ui-button
              @click="$router.go(-1)"
              class="text-muted-foreground"
              :icon="ICONS.previous"
              variant="ghost"
              size="icon-sm"
            />
            <ui-button
              @click="$router.go(1)"
              class="text-muted-foreground"
              :icon="ICONS.next"
              variant="ghost"
              size="icon-sm"
            />
          </ui-button-group>

          <!-- Breadcrumb -->
          <UiBreadcrumbs v-if="crumbs.length" :items="crumbs" class="text-xs md:text-sm" />
        </div>
        <!-- Actual Page -->
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
        <slot />
      </div>
    </div>
  </ClientOnly>
</template>
