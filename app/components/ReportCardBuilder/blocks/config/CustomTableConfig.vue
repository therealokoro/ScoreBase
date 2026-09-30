<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type { CustomTableConfig, CustomTableVariant } from "~~/shared/constants/report-card"

const config = defineModel<CustomTableConfig>({ required: true })

const variantOptions: { value: CustomTableVariant; label: string }[] = [
  { value: "static", label: "Fixed values" },
  { value: "manual", label: "Teacher fills in" }
]

function addRow() {
  config.value.rows.push({ id: typeid("row").toString(), label: "New row", value: "" })
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
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <UiLabel>Table type</UiLabel>
      <div class="flex items-center gap-1">
        <UiButton
          v-for="option in variantOptions"
          :key="option.value"
          type="button"
          size="sm"
          :variant="config.variant === option.value ? 'secondary' : 'ghost'"
          :text="option.label"
          @click="config.variant = option.value"
        />
      </div>
      <p class="text-muted-foreground text-xs">
        {{
          config.variant === "static"
            ? "Values are typed here and are the same on every student's report card."
            : "Labels are set here; teachers type the values for each student."
        }}
      </p>
    </div>

    <ReportCardBuilderStyledTextInput v-model="config.title" label="Table title" />

    <UiSeparator />

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <UiLabel>Rows</UiLabel>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add row"
          @click="addRow"
        />
      </div>

      <p v-if="config.rows.length === 0" class="text-muted-foreground text-xs">
        No rows yet — add one to build the table.
      </p>

      <div
        v-for="(row, index) in config.rows"
        :key="row.id"
        class="space-y-2 rounded-lg border border-border p-3"
      >
        <div class="flex items-center gap-2">
          <UiInput v-model="row.label" placeholder="Row label" class="flex-1" />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.up"
            :label="`Move row ${index + 1} up`"
            :disabled="index === 0"
            @click="moveRow(index, -1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.down"
            :label="`Move row ${index + 1} down`"
            :disabled="index === config.rows.length - 1"
            @click="moveRow(index, 1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.delete"
            :label="`Remove row ${index + 1}`"
            class="text-destructive"
            @click="removeRow(index)"
          />
        </div>

        <UiInput v-if="config.variant === 'static'" v-model="row.value" placeholder="Value" />
      </div>
    </div>
  </div>
</template>
