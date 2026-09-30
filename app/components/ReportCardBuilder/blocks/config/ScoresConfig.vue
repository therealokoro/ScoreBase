<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { ScoreColumnId, ScoresConfig } from "~~/shared/constants/report-card"

const config = defineModel<ScoresConfig>({ required: true })

/** Canonical display order — the checklist keeps columns sorted this way. */
const CANONICAL_ORDER: ScoreColumnId[] = [
  "subject",
  "ca1",
  "ca2",
  "ca3",
  "ca4",
  "ca5",
  "caTotal",
  "exam",
  "total",
  "classHighest",
  "classLowest",
  "classAverage",
  "grade",
  "remark",
  "subjectPosition"
]

const COLUMN_LABELS: Record<string, string> = {
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

const checklist = computed<{ key: ScoreColumnId; label: string }[]>(() =>
  CANONICAL_ORDER.map((key) => {
    const caMatch = /^ca(\d+)$/.exec(key)
    return {
      key,
      label: caMatch ? `CA ${caMatch[1]}` : (COLUMN_LABELS[key] ?? key)
    }
  })
)

/** CA slots currently listed in the checklist. */
const caSlots = computed(() => config.value.columns.filter((key) => /^ca\d+$/.test(key)))

// caMode mirrors the checklist so it never contradicts what actually renders.
const caMode = computed(() => (caSlots.value.length > 0 ? "breakdown" : "summed"))

function sortColumns() {
  config.value.columns = [...new Set(config.value.columns)].sort(
    (a, b) => CANONICAL_ORDER.indexOf(a) - CANONICAL_ORDER.indexOf(b)
  )
}

function toggleColumn(key: ScoreColumnId, checked: boolean) {
  const columns = config.value.columns
  if (checked) {
    if (!columns.includes(key)) columns.push(key)
  } else {
    config.value.columns = columns.filter((column) => column !== key)
  }
  sortColumns()
  config.value.caMode = caMode.value
}

/** Convenience switch: Breakdown lists every CA slot, Summed swaps them for CA Total. */
function setCaMode(mode: "breakdown" | "summed") {
  const columns = config.value.columns
  const withoutCa = columns.filter((key) => !/^ca\d+$/.test(key) && key !== "caTotal")
  config.value.columns =
    mode === "breakdown"
      ? [...withoutCa, "ca1", "ca2", "ca3", "ca4", "ca5"]
      : [...withoutCa, "caTotal"]
  sortColumns()
  config.value.caMode = caMode.value
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <UiLabel>CA display</UiLabel>
      <div class="flex items-center gap-1">
        <UiButton
          type="button"
          size="sm"
          :variant="caMode === 'breakdown' ? 'secondary' : 'ghost'"
          text="Breakdown"
          @click="setCaMode('breakdown')"
        />
        <UiButton
          type="button"
          size="sm"
          :variant="caMode === 'summed' ? 'secondary' : 'ghost'"
          text="Summed"
          @click="setCaMode('summed')"
        />
      </div>
      <p class="text-muted-foreground text-xs">
        Breakdown shows each CA column; Summed shows one CA Total. You can also mix them below.
      </p>
    </div>

    <UiSeparator />

    <div class="space-y-2">
      <UiLabel>Columns</UiLabel>

      <div class="space-y-1">
        <div
          v-for="column in checklist"
          :key="column.key"
          class="flex items-center gap-3 rounded-md border border-border px-3 py-2"
        >
          <UiTooltip v-if="column.key === 'subject'">
            <UiTooltipTrigger as-child>
              <span class="inline-flex">
                <UiSwitch
                  :model-value="true"
                  disabled
                  aria-label="Subject column is always shown"
                />
              </span>
            </UiTooltipTrigger>
            <UiTooltipContent>The Subject column is always shown.</UiTooltipContent>
          </UiTooltip>
          <UiCheckbox
            v-else
            :model-value="config.columns.includes(column.key)"
            :aria-label="`Show ${column.label}`"
            @update:model-value="(value) => toggleColumn(column.key, value === true)"
          />

          <button
            type="button"
            class="flex-1 text-left text-sm"
            :disabled="column.key === 'subject'"
            @click="
              column.key !== 'subject' &&
              toggleColumn(column.key, !config.columns.includes(column.key))
            "
          >
            {{ column.label }}
          </button>
        </div>
      </div>

      <p class="text-muted-foreground flex gap-2 text-xs">
        <Icon :name="ICONS.info" class="mt-0.5 size-3.5 shrink-0" />
        <span>
          CA slots above 3 are only shown when the result's score settings use that many. "Position"
          needs per-subject rankings, which are not available yet, so it prints a dash.
        </span>
      </p>
    </div>
  </div>
</template>
