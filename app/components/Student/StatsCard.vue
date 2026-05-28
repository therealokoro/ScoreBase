<script lang="ts">
export type StatsCardProps = {
  label: string
  value: string
  icon?: string
}
</script>

<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const props = withDefaults(defineProps<StatsCardProps>(), {
  icon: ICONS.student
})
</script>

<template>
  <UiCard>
    <UiCardContent class="flex items-center justify-between px-4">
      <div class="flex-1">
        <p class="text-muted-foreground text-xs font-medium" v-html="props.label" />
        <h3 class="mt-2 text-xl font-bold tracking-tight" v-html="props.value" />
      </div>
      <div class="flex size-8 md:size-10 items-center justify-center rounded-lg border">
        <Icon :name="props.icon" class="size-4 md:size-5" />
      </div>
    </UiCardContent>
  </UiCard>
</template>
