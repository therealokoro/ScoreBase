<script lang="ts" setup>
import type { ReportCardTemplate } from "~~/shared/constants/report-card"

const props = defineProps<{
  summary: ReportCardTemplate["main"]
  total: number | null
  average: number | null
  position: string
  totalStudents: number
}>()

// Phase 6: the template became a slot + block shape; this legacy summary prop is kept ONLY
// until Phase 7 deletes this component (its role moves to SummaryBlock.vue). Every reference
// to `legacy` below is a known-stale code path.
type LegacySummary = {
  placement: "header" | "footer"
  total: boolean
  average: boolean
  position: boolean
  outOf: boolean
}

const legacy = computed(() => props.summary as unknown as LegacySummary)

const stats = computed(() =>
  [
    legacy.value.total && { label: "Total Score", value: props.total ?? "—" },
    legacy.value.average && {
      label: "Average",
      value: props.average !== null ? `${props.average}%` : "—"
    },
    legacy.value.position && { label: "Position", value: props.position || "—" },
    legacy.value.outOf && { label: "Out of", value: `${props.totalStudents} students` }
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
