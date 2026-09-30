<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type {
  StudentInfoBorderStyle,
  StudentInfoConfig,
  StudentInfoField
} from "~~/shared/constants/report-card"

const config = defineModel<StudentInfoConfig>({ required: true })

const FIELD_OPTIONS: { value: StudentInfoField; label: string }[] = [
  { value: "student.name", label: "Student name" },
  { value: "student.id", label: "Student ID" },
  { value: "student.class", label: "Class" },
  { value: "class.size", label: "Class size" },
  { value: "term.name", label: "Term" },
  { value: "session.name", label: "Session" },
  { value: "result.average", label: "Average" },
  { value: "result.position", label: "Position" },
  { value: "result.positionOutOf", label: "Position (out of)" }
]

const columnOptions = [
  { value: "2", label: "2 columns" },
  { value: "3", label: "3 columns" },
  { value: "4", label: "4 columns" }
]

const borderOptions: { value: StudentInfoBorderStyle; label: string }[] = [
  { value: "outlined", label: "Outlined" },
  { value: "borderless", label: "Borderless" },
  { value: "shaded-labels", label: "Shaded labels" }
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
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-2">
        <UiLabel>Columns</UiLabel>
        <UiSelect v-model="columnsModel" :options="columnOptions" placeholder="Choose" />
      </div>

      <div class="space-y-2">
        <UiLabel>Border style</UiLabel>
        <div class="flex items-center gap-1">
          <UiButton
            v-for="option in borderOptions"
            :key="option.value"
            type="button"
            size="sm"
            :variant="config.borderStyle === option.value ? 'secondary' : 'ghost'"
            :text="option.label"
            @click="config.borderStyle = option.value"
          />
        </div>
      </div>
    </div>

    <UiSeparator />

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <UiLabel>Fields</UiLabel>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add field"
          @click="addField"
        />
      </div>

      <p v-if="config.fields.length === 0" class="text-muted-foreground text-xs">
        No fields yet — add one to show student details on the report card.
      </p>

      <div
        v-for="(field, index) in config.fields"
        :key="field.id"
        class="space-y-2 rounded-lg border border-border p-3"
      >
        <div class="flex items-center gap-2">
          <UiSelect
            v-model="field.field"
            :options="FIELD_OPTIONS"
            placeholder="Choose a field"
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

        <UiInput v-model="field.label" placeholder="Label shown on the report card" />
      </div>
    </div>
  </div>
</template>
