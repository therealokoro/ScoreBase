<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ScoreColumnId, ScoresConfig } from "~~/shared/constants/report-card"
import type { ComputedSubjectRow, SubjectClassData } from "~~/shared/utils/report-card"
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

const DEFAULT_LABELS: Record<string, string> = {
  subject: "Subject",
  caTotal: "CA Total",
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

/** A configured label wins; otherwise the built-in label (with the max appended where useful). */
function labelFor(key: ScoreColumnId): string {
  const override = props.config.columnLabels[key]
  if (override) return override
  if (key === "exam") return `${DEFAULT_LABELS.exam} (${scoreConfig.value.examMax})`
  return DEFAULT_LABELS[key] ?? key
}

const groupedCa = computed(
  () =>
    props.config.caDisplay === "breakdown-grouped" ||
    props.config.caDisplay === "breakdown-grouped-total"
)
const caColumns = computed<Column[]>(() => {
  if (props.config.caDisplay === "summed") return []
  return Array.from({ length: scoreConfig.value.caCount }, (_, index) => {
    const slot = index + 1
    const max = scoreConfig.value.caMaxScores[index] ?? "?"
    return {
      key: `ca${slot}` as ScoreColumnId,
      // `|` separates the two lines of the grouped head: "1st" over "(10)".
      label: groupedCa.value ? `${toOrdinal(slot)}|(${max})` : `CA ${slot} (${max})`
    }
  })
})

const caTotalColumn = computed<Column | null>(() =>
  props.config.caDisplay === "breakdown-grouped-total" || props.config.caDisplay === "summed"
    ? { key: "caTotal", label: labelFor("caTotal") }
    : null
)

/** Subject first, then the CA block (+ CA Total where configured), then the rest. */
const displayColumns = computed<Column[]>(() => {
  const [first, ...rest] = props.config.columns
  const head: Column[] = first ? [{ key: first, label: labelFor(first) }] : []
  const tail: Column[] = rest.map((key) => ({ key, label: labelFor(key) }))
  const caTotal = caTotalColumn.value
  return [...head, ...caColumns.value, ...(caTotal ? [caTotal] : []), ...tail]
})

const columnsBeforeCa = computed(() => displayColumns.value.slice(0, 1))
const columnsAfterCa = computed(() =>
  displayColumns.value.slice(1 + caColumns.value.length + (caTotalColumn.value ? 1 : 0))
)

/**
 * Column width weights. The subject column takes the largest share so long subject names wrap
 * instead of squeezing the numeric columns, and CA columns stay compact no matter how many exist.
 */
const CA_COLUMN_WEIGHT = 6
const COLUMN_WEIGHTS: Record<string, number> = {
  subject: 26,
  caTotal: 8,
  exam: 8,
  total: 8,
  grade: 6,
  classAverage: 9,
  classHighest: 7,
  classLowest: 7,
  subjectPosition: 9,
  remark: 12
}

/** Percentage widths for the fixed layout, normalised so the table always fills the page width. */
const columnWidths = computed<Record<string, string>>(() => {
  const weights = displayColumns.value.map((column) =>
    /^ca\d+$/.test(column.key) ? CA_COLUMN_WEIGHT : (COLUMN_WEIGHTS[column.key] ?? 8)
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1
  return Object.fromEntries(
    displayColumns.value.map((column, index) => [
      column.key,
      `${(((weights[index] ?? 0) / total) * 100).toFixed(3)}%`
    ])
  )
})

// ----------------------------------- Class data -----------------------------------

function classDataFor(row: ComputedSubjectRow): SubjectClassData | undefined {
  if (!row.subjectId) return undefined
  return resolveView(props.data).subjectClassData.find((entry) => entry.subjectId === row.subjectId)
}

function classHighest(row: ComputedSubjectRow): string {
  const totals = classDataFor(row)?.totals ?? []
  return totals.length > 0 ? String(Math.max(...totals)) : "—"
}

function classLowest(row: ComputedSubjectRow): string {
  const totals = classDataFor(row)?.totals ?? []
  return totals.length > 0 ? String(Math.min(...totals)) : "—"
}

function classAverage(row: ComputedSubjectRow): string {
  const totals = classDataFor(row)?.totals ?? []
  if (totals.length === 0) return "—"
  const average = totals.reduce((sum, total) => sum + total, 0) / totals.length
  return `${average.toFixed(2)}%`
}

/** Dense rank of this student's subject total, matching the overall position logic. */
function subjectPosition(row: ComputedSubjectRow): string {
  if (row.total === null) return "—"
  const totals = classDataFor(row)?.totals ?? []
  if (totals.length === 0) return "—"
  const sorted = [...new Set(totals)].sort((a, b) => b - a)
  const rank = sorted.indexOf(row.total) + 1
  return rank > 0 ? toOrdinal(rank) : "—"
}

function cellValue(row: ComputedSubjectRow, key: ScoreColumnId): string | number {
  const caMatch = /^ca(\d+)$/.exec(key)
  if (caMatch) return row.caScores[Number(caMatch[1]) - 1] ?? "—"
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
      return classHighest(row)
    case "classLowest":
      return classLowest(row)
    case "classAverage":
      return classAverage(row)
    case "subjectPosition":
      return subjectPosition(row)
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
      <!-- No scroll: fixed column widths keep the table inside the A4 width; heads wrap. -->
      <table class="w-full table-fixed text-xs">
        <colgroup>
          <col
            v-for="column in displayColumns"
            :key="column.key"
            :style="{ width: columnWidths[column.key] }"
          />
        </colgroup>
        <thead class="bg-muted/40">
          <!-- Grouped: one "Assessments" head spanning the CA columns -->
          <tr v-if="groupedCa" class="border-b border-border">
            <th
              v-for="column in columnsBeforeCa"
              :key="column.key"
              rowspan="2"
              class="border-border border-r px-1 py-1 align-middle text-[10px] font-medium break-words text-muted-foreground"
            >
              {{ column.label }}
            </th>
            <th
              :colspan="caColumns.length"
              class="border-border border-r px-1 py-1 text-center text-[10px] font-semibold"
            >
              Assessments
            </th>
            <th
              v-if="caTotalColumn"
              rowspan="2"
              class="border-border border-r px-1 py-1 text-center align-middle text-[10px] font-medium break-words text-muted-foreground"
            >
              {{ caTotalColumn.label }}
            </th>
            <th
              v-for="column in columnsAfterCa"
              :key="column.key"
              rowspan="2"
              class="border-border border-r px-1 py-1 text-center align-middle text-[10px] font-medium break-words text-muted-foreground"
            >
              {{ column.label }}
            </th>
          </tr>
          <tr v-if="groupedCa" class="border-b border-border">
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
              class="border-border border-r px-1 py-1 text-[10px] font-medium break-words text-muted-foreground"
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
              class="border-border border-r px-1.5 py-1 align-middle break-words last:border-r-0"
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
