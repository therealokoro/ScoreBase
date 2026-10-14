<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { ScoreColumnId, ScoresCaDisplay, ScoresConfig } from "~~/shared/constants/report-card"
import { FONT_WEIGHTS } from "~~/shared/constants/report-card"

const config = defineModel<ScoresConfig>({ required: true })

const weightOptions = FONT_WEIGHTS.map((weight) => ({ label: weight.label, value: weight.value }))

// The number of CA slots comes from result settings, never hardcoded here.
const { data: resultSettings } = useGetResultSettings()
const caCount = computed(() => resultSettings.value?.caCount ?? 3)

/** Canonical display order for the non-CA columns (CA columns are driven by caDisplay). */
const CANONICAL_ORDER: ScoreColumnId[] = [
  "subject",
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
  exam: "Exam",
  total: "Total",
  classHighest: "Class Highest",
  classLowest: "Class Lowest",
  classAverage: "Class Average",
  grade: "Grade",
  remark: "Remark",
  subjectPosition: "Position"
}

const caDisplayOptions: { value: ScoresCaDisplay; label: string }[] = [
  { value: "breakdown-grouped", label: "Breakdown — grouped under “Assessments”" },
  { value: "breakdown-grouped-total", label: "Breakdown — grouped + CA Total column" },
  { value: "breakdown-single", label: "Breakdown — one column per CA" },
  { value: "summed", label: "Summed — a single CA Total column" }
]

/** Columns whose header text the admin can override. CA columns are structural. */
const LABELABLE_KEYS: ScoreColumnId[] = [
  "subject",
  "exam",
  "total",
  "classHighest",
  "classLowest",
  "classAverage",
  "grade",
  "remark",
  "subjectPosition"
]

function setColumnLabel(key: ScoreColumnId, value: string) {
  if (value.trim() === "") {
    delete config.value.columnLabels[key]
    return
  }
  config.value.columnLabels[key] = value
}

const checklist = computed<{ key: ScoreColumnId; label: string }[]>(() =>
  CANONICAL_ORDER.map((key) => ({ key, label: COLUMN_LABELS[key] ?? key }))
)

/** The subject column always leads; every other column keeps the order the admin sets. */
function ensureSubjectFirst() {
  const columns = config.value.columns
  if (columns[0] === "subject") return
  config.value.columns = ["subject", ...columns.filter((column) => column !== "subject")]
}

function toggleColumn(key: ScoreColumnId, checked: boolean) {
  const columns = config.value.columns
  if (checked) {
    if (!columns.includes(key)) columns.push(key)
  } else {
    config.value.columns = columns.filter((column) => column !== key)
  }
  ensureSubjectFirst()
}

/** Whether a column can move one place up (-1) or down (1). Subject stays pinned to the front. */
function canMove(key: ScoreColumnId, direction: -1 | 1): boolean {
  const columns = config.value.columns
  const index = columns.indexOf(key)
  if (index <= 0) return false
  const target = index + direction
  return target > 0 && target < columns.length
}

function moveColumn(key: ScoreColumnId, direction: -1 | 1) {
  if (!canMove(key, direction)) return
  const columns = config.value.columns
  const index = columns.indexOf(key)
  const [item] = columns.splice(index, 1)
  if (item) columns.splice(index + direction, 0, item)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <UiLabel class="text-xs">CA display</UiLabel>
      <ReportCardBuilderSmallSelect v-model="config.caDisplay" :options="caDisplayOptions" />
      <p class="text-muted-foreground text-[10px]">
        Uses {{ caCount }} CA {{ caCount === 1 ? "slot" : "slots" }} from your result settings.
      </p>
    </div>

    <UiSeparator />

    <div class="space-y-2">
      <UiLabel class="text-xs">Other columns</UiLabel>

      <div class="space-y-1">
        <div
          v-for="column in checklist"
          :key="column.key"
          class="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
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
            class="flex-1 text-left text-xs"
            :disabled="column.key === 'subject'"
            @click="
              column.key !== 'subject' &&
              toggleColumn(column.key, !config.columns.includes(column.key))
            "
          >
            {{ column.label }}
          </button>

          <!-- Reorder the visible columns; the subject column stays first. -->
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.up"
            :label="`Move ${column.label} up`"
            :disabled="!canMove(column.key, -1)"
            @click="moveColumn(column.key, -1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.down"
            :label="`Move ${column.label} down`"
            :disabled="!canMove(column.key, 1)"
            @click="moveColumn(column.key, 1)"
          />
        </div>
      </div>

      <p class="text-muted-foreground text-[10px]">
        Order the columns with the arrows. The Subject column is always first, and the CA columns
        are inserted after it from your CA display setting.
      </p>
    </div>

    <UiSeparator />

    <div class="space-y-3">
      <UiLabel class="text-xs">Table text</UiLabel>

      <div class="flex items-center gap-2">
        <span class="text-muted-foreground w-10 text-[10px]">Size</span>
        <UiSlider
          :model-value="[config.fontSize]"
          :min="8"
          :max="20"
          :step="1"
          @update:model-value="(value) => (config.fontSize = value?.[0] ?? 12)"
        />
        <span class="w-5 text-right text-[10px] tabular-nums">{{ config.fontSize }}</span>
      </div>

      <p class="text-muted-foreground text-[10px]">
        Table and grid rules are set for the whole card under General → Table borders.
      </p>

      <div class="space-y-1.5">
        <UiLabel class="text-xs">Weight</UiLabel>
        <ReportCardBuilderSmallSelect
          v-model="config.fontWeight"
          :options="weightOptions"
          class="max-w-32"
        />
      </div>

      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground text-[10px]">Text colour</span>
        <ReportCardBuilderColorPickerPopover
          v-model="config.textColor"
          label="Score table text colour"
        />
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-xs">
        <UiSwitch v-model="config.showScoreMax" />
        Show column maximums
      </label>
      <p class="text-muted-foreground text-[10px]">
        Prints each column's maximum in brackets on its own line under the heading — "Term Exam"
        over "(70)" — so every head lines up. Turning it off hides all of them at once.
      </p>
    </div>

    <UiSeparator />

    <div class="space-y-2">
      <UiLabel class="text-xs">Column headings</UiLabel>
      <p class="text-muted-foreground text-[10px]">
        Leave a field empty to use the default heading.
      </p>
      <div v-for="key in LABELABLE_KEYS" :key="key" class="flex items-center gap-2">
        <span class="text-muted-foreground w-24 shrink-0 text-[10px]">
          {{ COLUMN_LABELS[key] ?? key }}
        </span>
        <UiInput
          :model-value="config.columnLabels[key] ?? ''"
          :placeholder="COLUMN_LABELS[key] ?? key"
          class="h-7 flex-1 text-[11px]"
          @update:model-value="(value) => setColumnLabel(key, String(value))"
        />
      </div>
    </div>
  </div>
</template>
