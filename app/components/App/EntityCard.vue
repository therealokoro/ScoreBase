<script lang="ts" setup>
import { normalizeClass } from "vue"

const props = defineProps<{
  title: string
  link?: string
  icon?: string
  description?: string
  class?: string
}>()

const styles = tv({ base: "group relative justify-center gap-2 px-4" })
</script>

<template>
  <UiCard clickable :to="link" :class="styles({ class: normalizeClass(props.class) || undefined })">
    <UiCardTitle>{{ title }}</UiCardTitle>
    <slot name="description">
      <UiCardDescription v-if="description">{{ description }}</UiCardDescription>
    </slot>
    <div
      v-if="icon"
      class="absolute flex items-center inset-y-0 right-4 z-2 group-hover:translate-x-2 transition"
    >
      <Icon name="lucide:arrow-right" variant="ghost" />
    </div>
  </UiCard>
</template>
