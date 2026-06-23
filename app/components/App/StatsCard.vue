<script lang="ts">
export type StatsCardProps = {
  label: string
  value: string | number
  icon?: string
}
</script>

<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const props = withDefaults(defineProps<StatsCardProps>(), {
  icon: ICONS.students
})
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2 rounded-lg border">
    <div class="flex items-center gap-2 sm:gap-4">
      <Icon :name="props.icon" class="size-4" />
      <p class="text-muted-foreground text-xs font-medium text-ellipsis truncate">
        {{ props.label }}
      </p>
    </div>
    <h3 class="font-bold tracking-tight">{{ props.value }}</h3>
  </div>
</template>
