<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ScoreColumnId, ScoresConfig } from "~~/shared/constants/report-card"
import type { ComputedSubjectRow } from "~~/shared/utils/report-card"
import { toOrdinal } from "~~/shared/utils/report-card"

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

const NON_CA_LABELS: Record<string, string> = {
  subject: "Subject",
  exam: "Exam",
  total: "Total",
  classHighest: "Class Highest",
  classLowest: "Class Lowest",
  classAverage: "Class Average",
  grade: "Grade",
  remark: "Remark",
  subjectPosition: "Position"
}

const scoreConfig = computed(() => resolveView(props.data).scoreConfig)

/** The CA columns are driven entirely by `caDisplay` — never listed in `columns`. */
const caColumns = computed<Column[]>(() => {
  if (props.config.caDisplay === "summed") {
    return [{ key: "caTotal", label: "CA Total" }]
  }
  return Array.from({ length: scoreConfig.value.caCount }, (_, index) => {
    const slot = index + 1
    const max = scoreConfig.value.caMaxScores[index] ?? "?"
    return {
      key: `ca${slot}` as ScoreColumnId,
      label: props.config.caDisplay === "breakdown-grouped" ? `${toOrdinal(slot)}|(${max})` : `CA ${slot} (${max})`
    }
  })
})

/** subject first, then the CA block, then the rest of the configured columns. */
const displayColumns = computed<Column[]>(() => {
  const [first, ...rest] = props.config.columns
  const head: Column[] = first ? [{ key: first, label: NON_CA_LABELS[first] ?? first }] : []
  const tail: Column[] = rest.map((key) => ({ key, label: NON_CA_LABELS[key] ?? key }))
  return [...head, ...caColumns.value, ...tail]
})

const columnsBeforeCa = computed(() => displayColumns.value.slice(0, 1))
const columnsAfterCa = computed(() => displayColumns.value.slice(1 + caColumns.value.length))
const grouped = computed(() => props.config.caDisplay === "breakdown-grouped")

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
      <!-- No scroll: the table fits the A4 width. Heads wrap instead of overflowing. -->
      <table class="w-full table-auto text-xs">
        <thead>
          <!-- Grouped: one "Assessments" head spanning the CA columns -->
          <tr v-if="grouped" class="border-b border-border">
            <th
              v-for="column in columnsBeforeCa"
              :key="column.key"
              rowspan="2"
              class="border-border border-r px-1 py-1 text-[10px] font-medium text-muted-foreground align-middle break-words"
            >
              {{ column.label }}
            </th>
            <th
              :colspan="caColumns.length"
              class="border-border border-r bg-muted/40 px-1 py-1 text-center text-[10px] font-semibold"
            >
              Assessments
            </th>
            <th
              v-for="column in columnsAfterCa"
              :key="column.key"
              rowspan="2"
              class="border-border border-r px-1 py-1 text-center text-[10px] font-medium text-muted-foreground align-middle break-words"
            >
              {{ column.label }}
            </th>
          </tr>
          <tr v-if="grouped" class="border-b border-border">
            <th
              v-for="column in caColumns"
              :key="column.key"
              class="border-border border-r px-1 py-0.5 text-center text-[10px] font-medium"
            >
              <span class="block">{{ column.label.split("|")[0] }}</span>
              <span class="text-muted-foreground block text-[9px]">
                {{ column.label.split("|")[1] }}
              </span>
            </th>
          </tr>

          <!-- Single columns / summed -->
          <tr v-else class="border-b border-border">
            <th
              v-for="column in displayColumns"
              :key="column.key"
              class="border-border border-r px-1 py-1 text-[10px] font-medium text-muted-foreground break-words"
              :class="column.key === 'subject' ? '' : 'text-center'"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in subjectRows" :key="row.id" class="border-b border-border last:border-0">
            <td
              v-for="column in displayColumns"
              :key="column.key"
              class="border-border border-r px-1 py-1 last:border-r-0"
              :class="[
                column.key === 'subject' ? 'font-medium' : 'text-center',
                isBlank(row, column.key) ? 'text-muted-foreground' : ''
              ]"
            >
              {{ cellValue(row, column.key) }}
            </td>
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
