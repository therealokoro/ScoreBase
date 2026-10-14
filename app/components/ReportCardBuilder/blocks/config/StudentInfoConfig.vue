<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type {
  FontWeight,
  LabelPlacement,
  StudentInfoBorderStyle,
  StudentInfoConfig,
  StudentInfoField
} from "~~/shared/constants/report-card"
import { FONT_WEIGHTS } from "~~/shared/constants/report-card"

const config = defineModel<StudentInfoConfig>({ required: true })

const FONT_WEIGHT_OPTIONS = FONT_WEIGHTS.map((weight) => ({
  label: weight.label,
  value: weight.value
}))

const FIELD_OPTIONS: { value: StudentInfoField; label: string }[] = [
  { value: "student.name", label: "Student name" },
  { value: "student.id", label: "Student ID" },
  { value: "student.class", label: "Class" },
  { value: "class.size", label: "Class size" },
  { value: "term.name", label: "Term" },
  { value: "session.name", label: "Session" },
  { value: "result.average", label: "Average" },
  { value: "result.position", label: "Position" }
]

const columnOptions = [
  { value: "2", label: "2 columns" },
  { value: "3", label: "3 columns" },
  { value: "4", label: "4 columns" }
]

const borderOptions: { value: StudentInfoBorderStyle; label: string }[] = [
  { value: "outlined", label: "Outlined" },
  { value: "bordered", label: "Bordered grid" },
  { value: "borderless", label: "Borderless" }
]

const labelOptions: { value: LabelPlacement; label: string }[] = [
  { value: "top", label: "Label above the value" },
  { value: "side", label: "Label beside the value" }
]

const columnsModel = computed({
  get: () => String(config.value.columns),
  set: (value: string) => {
    config.value.columns = Number(value) as 2 | 3 | 4
  }
})

function addField() {
  config.value.fields.push({
    id: typeid("field").toString(),
    field: "student.name",
    label: "New field"
  })
}

function removeField(index: number) {
  config.value.fields.splice(index, 1)
}

function moveField(index: number, direction: -1 | 1) {
  const target = index + direction
  const fields = config.value.fields
  if (target < 0 || target >= fields.length) return
  const [item] = fields.splice(index, 1)
  if (item) fields.splice(target, 0, item)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <UiLabel class="text-xs">Columns</UiLabel>
      <ReportCardBuilderSmallSelect v-model="columnsModel" :options="columnOptions" />
    </div>

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Border style</UiLabel>
      <ReportCardBuilderSmallSelect v-model="config.borderStyle" :options="borderOptions" />
    </div>

    <div v-if="config.borderStyle !== 'borderless'" class="space-y-1.5">
      <UiLabel class="text-xs">Border thickness</UiLabel>
      <div class="flex items-center gap-2">
        <UiSlider
          :model-value="[config.borderWidth]"
          :min="0"
          :max="4"
          :step="1"
          @update:model-value="(value) => (config.borderWidth = value?.[0] ?? 1)"
        />
        <span class="w-8 text-right text-[10px] tabular-nums">{{ config.borderWidth }}px</span>
      </div>
    </div>

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Labels</UiLabel>
      <ReportCardBuilderSmallSelect v-model="config.labelPlacement" :options="labelOptions" />
    </div>

    <UiSeparator />

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Value text</UiLabel>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground w-8 text-[10px]">Size</span>
        <UiSlider
          :model-value="[config.valueFontSize]"
          :min="8"
          :max="16"
          :step="1"
          @update:model-value="(value) => (config.valueFontSize = value?.[0] ?? 11)"
        />
        <span class="w-5 text-right text-[10px] tabular-nums">{{ config.valueFontSize }}</span>
      </div>
      <ReportCardBuilderSmallSelect
        :model-value="config.valueFontWeight"
        :options="FONT_WEIGHT_OPTIONS"
        @update:model-value="(value) => (config.valueFontWeight = value as FontWeight)"
      />
    </div>

    <UiSeparator />

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <UiLabel class="text-xs">Fields</UiLabel>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add field"
          @click="addField"
        />
      </div>

      <p v-if="config.fields.length === 0" class="text-muted-foreground text-[10px]">
        No fields yet — add one to show student details on the report card.
      </p>

      <div
        v-for="(field, index) in config.fields"
        :key="field.id"
        class="space-y-2 rounded-md border border-border p-2"
      >
        <div class="flex items-center gap-1">
          <ReportCardBuilderSmallSelect
            v-model="field.field"
            :options="FIELD_OPTIONS"
            class="flex-1"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.up"
            :label="`Move field ${index + 1} up`"
            :disabled="index === 0"
            @click="moveField(index, -1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.down"
            :label="`Move field ${index + 1} down`"
            :disabled="index === config.fields.length - 1"
            @click="moveField(index, 1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.delete"
            :label="`Remove field ${index + 1}`"
            class="text-destructive"
            @click="removeField(index)"
          />
        </div>

        <UiInput
          v-model="field.label"
          placeholder="Label shown on the report card"
          class="h-8 text-xs"
        />
      </div>
    </div>
  </div>
</template>
