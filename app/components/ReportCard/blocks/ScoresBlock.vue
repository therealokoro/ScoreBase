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

/** Columns before the CA run — used to build the grouped CA heading. */
const caColumns = computed(() => columns.value.filter((column) => /^ca\d+$/.test(column.key)))
const caRange = computed(() => {
  const config = resolveView(props.data).scoreConfig
  const slots = caColumns.value.map((column) => Number(/^ca(\d+)$/.exec(column.key)![1]))
  const total = slots.reduce((sum, slot) => sum + (config.caMaxScores[slot - 1] ?? 0), 0)
  return { count: slots.length, total }
})
const groupedCa = computed(() => props.config.caHeading === "grouped" && caRange.value.count > 0)
const caIndex = computed(() => columns.value.findIndex((column) => /^ca\d+$/.test(column.key)))
const columnsBeforeCa = computed(() => (caIndex.value >= 0 ? columns.value.slice(0, caIndex.value) : []))
const columnsAfterCa = computed(() =>
  caIndex.value >= 0 ? columns.value.slice(caIndex.value + caRange.value.count) : columns.value
)

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

const subjectRows = computed(() => resolveView(props.data).subjectRows)
</script>

<template>
  <div data-block-type="scores">
    <div class="border-border overflow-hidden rounded-lg border">
      <!-- No scroll container: the table is sized to fit the A4 width. Headers are absolutely
           positioned so they never widen a column — columns size to their body values. -->
      <table class="w-full table-auto text-xs">
        <thead>
          <tr class="border-b border-border">
            <template v-if="groupedCa">
              <th
                v-for="column in columnsBeforeCa"
                :key="column.key"
                class="relative h-7 px-1 text-[10px] font-medium text-muted-foreground"
              >
                <span class="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  {{ column.label }}
                </span>
                <span class="invisible">0</span>
              </th>
              <th class="relative h-7 px-1 text-[10px] font-medium text-muted-foreground">
                <span class="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  CA ({{ caRange.total }})
                </span>
                <span class="invisible">0</span>
              </th>
              <th
                v-for="column in columnsAfterCa"
                :key="column.key"
                class="relative h-7 px-1 text-[10px] font-medium text-muted-foreground"
              >
                <span class="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  {{ column.label }}
                </span>
                <span class="invisible">0</span>
              </th>
            </template>

            <template v-else>
              <th
                v-for="column in columns"
                :key="column.key"
                class="relative h-7 px-1 text-[10px] font-medium text-muted-foreground"
              >
                <span class="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  {{ column.label }}
                </span>
                <span class="invisible">0</span>
              </th>
            </template>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in subjectRows" :key="row.id" class="border-b border-border last:border-0">
            <template v-if="groupedCa">
              <td
                v-for="column in columnsBeforeCa"
                :key="column.key"
                class="px-1 py-1"
                :class="[
                  column.key === 'subject' ? 'font-medium' : 'text-center',
                  isBlank(row, column.key) ? 'text-muted-foreground' : ''
                ]"
              >
                {{ cellValue(row, column.key) }}
              </td>
              <td
                v-for="column in caColumns"
                :key="column.key"
                class="px-1 py-1 text-center"
                :class="isBlank(row, column.key) ? 'text-muted-foreground' : ''"
              >
                {{ cellValue(row, column.key) }}
              </td>
              <td
                v-for="column in columnsAfterCa"
                :key="column.key"
                class="px-1 py-1 text-center"
                :class="isBlank(row, column.key) ? 'text-muted-foreground' : ''"
              >
                <UiBadge v-if="column.key === 'grade' && row.grade" variant="outline">
                  {{ row.grade }}
                </UiBadge>
                <template v-else>{{ cellValue(row, column.key) }}</template>
              </td>
            </template>

            <template v-else>
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-1 py-1"
                :class="[
                  column.key === 'subject' ? 'font-medium' : 'text-center',
                  isBlank(row, column.key) ? 'text-muted-foreground' : ''
                ]"
              >
                <UiBadge v-if="column.key === 'grade' && row.grade" variant="outline">
                  {{ row.grade }}
                </UiBadge>
                <template v-else>{{ cellValue(row, column.key) }}</template>
              </td>
            </template>
          </tr>

          <tr v-if="subjectRows.length === 0">
            <td colspan="100" class="text-muted-foreground px-2 py-1 text-center text-xs">
              No subject scores yet
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
