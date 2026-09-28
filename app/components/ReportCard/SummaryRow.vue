<script lang="ts" setup>
import type { ReportCardTemplate } from "~~/shared/constants/kv-settings"

const props = defineProps<{
  summary: ReportCardTemplate["summary"]
  total: number | null
  average: number | null
  position: string
  totalStudents: number
}>()

const stats = computed(() =>
  [
    props.summary.total && { label: "Total Score", value: props.total ?? "—" },
    props.summary.average && {
      label: "Average",
      value: props.average !== null ? `${props.average}%` : "—"
    },
    props.summary.position && { label: "Position", value: props.position || "—" },
    props.summary.outOf && { label: "Out of", value: `${props.totalStudents} students` }
  ].filter((stat): stat is { label: string; value: string | number } => Boolean(stat))
)
</script>

<template>
  <div
    v-if="stats.length"
    class="border-border bg-muted/40 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border p-3 text-sm"
  >
    <div v-for="stat in stats" :key="stat.label">
      <p class="text-muted-foreground text-[10px] tracking-wide uppercase">{{ stat.label }}</p>
      <p class="font-semibold">{{ stat.value }}</p>
    </div>
  </div>
</template>
