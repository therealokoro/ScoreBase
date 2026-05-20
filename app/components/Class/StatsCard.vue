<script lang="ts">
export type StatsCardProps = {
  label: string
  value: string
  icon?: string
  iconBg?: string
  iconColor?: string
}
</script>

<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const props = withDefaults(defineProps<StatsCardProps>(), {
  icon: ICONS.students
})
</script>

<template>
  <UiCard>
    <UiCardContent class="flex items-center justify-between px-4">
      <div class="flex-1">
        <p class="text-muted-foreground text-xs font-medium" v-html="props.label" />
        <h3 class="mt-2 text-xl font-bold tracking-tight" v-html="props.value" />
      </div>
      <div
        :class="[
          'flex size-10 items-center justify-center rounded-lg',
          props.iconBg || 'bg-primary/10'
        ]"
      >
        <Icon :name="props.icon" :class="['size-5', props.iconColor || 'text-primary']" />
      </div>
    </UiCardContent>
  </UiCard>
</template>
