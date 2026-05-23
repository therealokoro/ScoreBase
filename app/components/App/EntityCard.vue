<script lang="ts" setup>
import { normalizeClass } from "vue"
import { ICONS } from "~~/shared/constants/icons"

const props = defineProps<{
  title: string
  link?: string
  noIcon?: boolean
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
    <div class="absolute flex items-center inset-y-0 right-4 z-2">
      <slot name="action">
        <div v-if="!noIcon" class="group-hover:translate-x-2 transition">
          <Icon :name="ICONS.forward" variant="ghost" />
        </div>
      </slot>
    </div>
  </UiCard>
</template>
