<script lang="ts" setup>
export type StatCardItem = {
  key: string
  label: string
  value: string | number
  icon: string
  classes: string
  /** Span 2 grid columns instead of 1 — for cards needing more room (e.g. a longer text value). */
  wide?: boolean
}

defineProps<{ stats: StatCardItem[] }>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5"
      :class="stat.wide ? 'sm:col-span-2 lg:col-span-2' : ''"
    >
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-full"
        :class="stat.classes"
      >
        <Icon :name="stat.icon" class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
        <p class="font-semibold leading-tight truncate" :title="String(stat.value)">
          {{ stat.value }}
        </p>
      </div>
    </div>
  </div>
</template>
