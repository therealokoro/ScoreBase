<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ScoreColumnId, ScoresConfig } from "~~/shared/constants/report-card"
import type { ComputedSubjectRow } from "~~/shared/utils/report-card"

import { resolveView } from "./placeholder"

const props = defineProps<{
  config: ScoresConfig
  data?: ReportCardData | null
  blockId?: string
}>()

interface Column {
  key: ScoreColumnId
  label: string
}

const columns = computed<Column[]>(() => {
  const config = resolveView(props.data).scoreConfig
  return props.config.columns.map((key): Column => {
    const caMatch = /^ca(\d+)$/.exec(key)
    if (caMatch) {
      const slot = Number(caMatch[1])
      return { key, label: `CA ${slot} (${config.caMaxScores[slot - 1] ?? "?"})` }
    }
    switch (key) {
      case "subject":
        return { key, label: "Subject" }
      case "caTotal":
        return { key, label: "CA Total" }
      case "exam":
        return { key, label: `Exam (${config.examMax})` }
      case "total":
        return { key, label: "Total" }
      case "classHighest":
        return { key, label: "Class Highest" }
      case "classLowest":
        return { key, label: "Class Lowest" }
      case "classAverage":
        return { key, label: "Class Average" }
      case "grade":
        return { key, label: "Grade" }
      case "remark":
        return { key, label: "Remark" }
      case "subjectPosition":
        return { key, label: "Position" }
      default:
        return { key, label: key }
    }
  })
})

const classStats = computed(() => {
  const totals = resolveView(props.data).allStudentTotals
  if (totals.length === 0) return null
  return {
    highest: Math.max(...totals),
    lowest: Math.min(...totals),
    average: +(totals.reduce((sum, total) => sum + total, 0) / totals.length).toFixed(2)
  }
})

function cellValue(row: ComputedSubjectRow, key: ScoreColumnId): string | number {
  const stats = classStats.value
  const caMatch = /^ca(\d+)$/.exec(key)
  if (caMatch) {
    return row.caScores[Number(caMatch[1]) - 1] ?? "—"
  }
  switch (key) {
    case "subject":
      return row.subjectName
    case "caTotal":
      return row.caTotal ?? "—"
    case "exam":
      return row.exam ?? "—"
    case "total":
      return row.total ?? "—"
    case "grade":
      return row.grade || "—"
    case "remark":
      return row.remark || "—"
    case "classHighest":
      return stats ? stats.highest : "—"
    case "classLowest":
      return stats ? stats.lowest : "—"
    case "classAverage":
      return stats ? stats.average : "—"
    // Per-subject position needs class-wide per-subject rankings, which ReportCardData does
    // not carry yet — render a dash rather than guessing.
    case "subjectPosition":
      return "—"
    default:
      return "—"
  }
}

function isBlank(row: ComputedSubjectRow, key: ScoreColumnId): boolean {
  return cellValue(row, key) === "—"
}
</script>

<template>
  <div data-block-type="scores">
    <div class="border-border overflow-hidden rounded-lg border">
      <UiScrollArea class="grid overflow-x-auto" orientation="horizontal">
        <UiTable class="w-full table-auto" aria-label="Subject scores">
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead
                v-for="column in columns"
                :key="column.key"
                class="whitespace-nowrap"
                :class="
                  column.key === 'subject'
                    ? 'border-border sticky left-0 z-10 min-w-35 border-r bg-card'
                    : 'text-center min-w-15'
                "
              >
                {{ column.label }}
              </UiTableHead>
            </UiTableRow>
          </UiTableHeader>

          <UiTableBody>
            <UiTableRow v-for="row in resolveView(props.data).subjectRows" :key="row.id">
              <UiTableCell
                v-for="column in columns"
                :key="column.key"
                :class="[
                  column.key === 'subject'
                    ? 'border-border sticky left-0 z-10 border-r bg-card font-medium'
                    : 'text-center',
                  isBlank(row, column.key) ? 'text-muted-foreground' : ''
                ]"
              >
                <UiBadge v-if="column.key === 'grade' && row.grade" variant="outline">
                  {{ row.grade }}
                </UiBadge>
                <template v-else>{{ cellValue(row, column.key) }}</template>
              </UiTableCell>
            </UiTableRow>

            <UiTableRow v-if="resolveView(props.data).subjectRows.length === 0">
              <UiTableCell colspan="100" class="text-muted-foreground text-center text-sm">
                No subject scores yet
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiScrollArea>
    </div>
  </div>
</template>
