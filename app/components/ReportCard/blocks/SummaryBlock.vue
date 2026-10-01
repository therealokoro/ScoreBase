<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { SummaryConfig, SummaryMetric } from "~~/shared/constants/report-card"

import { resolveView } from "./placeholder"

const props = defineProps<{
  config: SummaryConfig
  data?: ReportCardData | null
  blockId?: string
}>()

const METRIC_LABELS: Record<SummaryMetric, string> = {
  marksObtainable: "Marks Obtainable",
  marksObtained: "Marks Obtained",
  subjectsOffered: "Subjects Offered",
  average: "Average",
  position: "Position",
  positionOutOf: "Out of"
}

const stats = computed(() => {
  const view = resolveView(props.data)
  const config = view.scoreConfig
  // Marks obtainable per subject: every CA slot's maximum plus the exam maximum.
  const perSubjectMax = config.caMaxScores.reduce((sum, max) => sum + max, 0) + config.examMax

  return props.config.metrics.map((metric) => {
    switch (metric) {
      case "marksObtainable":
        return {
          key: metric,
          label: METRIC_LABELS[metric],
          value: perSubjectMax * view.subjectCount
        }
      case "marksObtained":
        return { key: metric, label: METRIC_LABELS[metric], value: view.grandTotal ?? "—" }
      case "subjectsOffered":
        return { key: metric, label: METRIC_LABELS[metric], value: view.subjectCount }
      case "average":
        return {
          key: metric,
          label: METRIC_LABELS[metric],
          value: view.average !== null ? `${view.average}%` : "—"
        }
      case "position":
        return { key: metric, label: METRIC_LABELS[metric], value: view.position || "—" }
      case "positionOutOf":
        return {
          key: metric,
          label: METRIC_LABELS[metric],
          value: `${view.totalStudents} students`
        }
      default:
        return { key: metric, label: metric, value: "—" }
    }
  })
})
</script>

<template>
  <div data-block-type="summary">
    <div
      v-if="config.style === 'inline'"
      class="border-border bg-muted/40 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border p-3"
    >
      <div
        v-for="stat in stats"
        :key="stat.key"
        :class="config.labelPlacement === 'side' ? 'flex items-baseline gap-2' : ''"
      >
        <p class="text-muted-foreground text-[10px] tracking-wide uppercase">{{ stat.label }}</p>
        <p class="text-xs font-semibold">{{ stat.value }}</p>
      </div>
    </div>

    <dl
      v-else
      class="border-border bg-muted/40 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-3"
    >
      <div v-for="stat in stats" :key="stat.key" class="flex items-baseline justify-between gap-2">
        <dt class="text-muted-foreground text-[10px]">{{ stat.label }}</dt>
        <dd class="text-xs font-semibold">{{ stat.value }}</dd>
      </div>
    </dl>
  </div>
</template>
