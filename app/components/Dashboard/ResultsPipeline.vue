<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

defineProps<{
  title: string
  counts: { draft: number; submitted: number; reviewed: number; published: number }
}>()

const STATUS_META = [
  { key: "draft", label: "Draft", icon: ICONS.document, classes: "bg-muted text-muted-foreground" },
  {
    key: "submitted",
    label: "Submitted",
    icon: ICONS.pending,
    classes: "bg-warning/10 text-warning"
  },
  {
    key: "reviewed",
    label: "Reviewed",
    icon: ICONS.approve,
    classes: "bg-info/10 text-info"
  },
  {
    key: "published",
    label: "Published",
    icon: ICONS.publish,
    classes: "bg-success/10 text-success"
  }
] as const
</script>

<template>
  <div class="flex-1 rounded-lg border bg-card p-4">
    <div class="flex items-center gap-2 mb-4">
      <Icon :name="ICONS.result" class="size-4" />
      <p class="text-sm font-semibold">{{ title }}</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div
        v-for="status in STATUS_META"
        :key="status.key"
        class="flex items-center justify-between rounded-md p-3"
        :class="status.classes"
      >
        <div class="flex items-center gap-1.5">
          <Icon :name="status.icon" class="size-3.5 opacity-80" />
          <p class="text-xs opacity-80">{{ status.label }}</p>
        </div>
        <p class="text-2xl font-semibold leading-tight">{{ counts[status.key] }}</p>
      </div>
    </div>
  </div>
</template>
