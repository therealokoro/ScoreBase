<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import { DEFAULT_GRADE_BOUNDARIES } from "~~/shared/constants/kv-settings"
import type { GradingKeyConfig } from "~~/shared/constants/report-card"

const config = defineModel<GradingKeyConfig>({ required: true })

// The live grade scale lives in result settings; this block seeds from it and stays editable.
const { data: resultSettings } = useGetResultSettings()

function addRow() {
  config.value.rows.push({ id: typeid("row").toString(), label: "", min: 0, max: 0, remark: "" })
}

function removeRow(index: number) {
  config.value.rows.splice(index, 1)
}

function moveRow(index: number, direction: -1 | 1) {
  const target = index + direction
  const rows = config.value.rows
  if (target < 0 || target >= rows.length) return
  const [item] = rows.splice(index, 1)
  if (item) rows.splice(target, 0, item)
}

/** Re-seeds the rows from result settings (or the standard scale when unavailable). */
function refreshFromSettings() {
  const boundaries = resultSettings.value?.gradeBoundaries ?? DEFAULT_GRADE_BOUNDARIES
  config.value.rows = boundaries.map((boundary) => ({
    id: typeid("row").toString(),
    label: boundary.label,
    min: boundary.min,
    max: boundary.max,
    remark: boundary.remark
  }))
}
</script>

<template>
  <div class="space-y-4">
    <ReportCardBuilderStyledTextInput
      v-model="config.title"
      label="Title"
      :min-size="10"
      :max-size="16"
    />

    <div class="flex items-center justify-between gap-2">
      <UiLabel class="text-xs">Grades</UiLabel>
      <div class="flex items-center gap-1">
        <UiButton
          type="button"
          variant="ghost"
          size="sm"
          :icon="ICONS.restore"
          text="From result settings"
          @click="refreshFromSettings"
        />
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add"
          @click="addRow"
        />
      </div>
    </div>

    <p class="text-muted-foreground text-[10px]">
      Seeded from result settings when the block is added. Edit the grades here to suit this
      template.
    </p>

    <div class="space-y-2">
      <div
        v-for="(row, index) in config.rows"
        :key="row.id"
        class="space-y-2 rounded-md border border-border p-2"
      >
        <div class="flex items-center gap-1">
          <UiInput v-model="row.label" placeholder="Grade" class="h-8 w-16 text-xs" />
          <UiInput
            v-model.number="row.min"
            type="number"
            placeholder="Min"
            class="h-8 flex-1 text-xs"
          />
          <UiInput
            v-model.number="row.max"
            type="number"
            placeholder="Max"
            class="h-8 flex-1 text-xs"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.up"
            :label="`Move grade ${index + 1} up`"
            :disabled="index === 0"
            @click="moveRow(index, -1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.down"
            :label="`Move grade ${index + 1} down`"
            :disabled="index === config.rows.length - 1"
            @click="moveRow(index, 1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.delete"
            :label="`Remove grade ${index + 1}`"
            class="text-destructive"
            @click="removeRow(index)"
          />
        </div>

        <UiInput v-model="row.remark" placeholder="Remark, e.g. Excellent" class="h-8 text-xs" />
      </div>
    </div>
  </div>
</template>
