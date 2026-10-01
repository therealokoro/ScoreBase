<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type { PsychomotorConfig } from "~~/shared/constants/report-card"
import { DEFAULT_PSYCHOMOTOR_SKILLS } from "~~/shared/constants/report-card"

const config = defineModel<PsychomotorConfig>({ required: true })

function addRow() {
  config.value.rows.push({ id: typeid("row").toString(), label: "New skill" })
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

function restoreDefaults() {
  config.value.rows = DEFAULT_PSYCHOMOTOR_SKILLS.map((label) => ({
    id: typeid("row").toString(),
    label
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

    <p class="bg-muted text-muted-foreground flex gap-2 rounded p-2 text-[10px]">
      <Icon :name="ICONS.info" class="mt-0.5 size-3 shrink-0" />
      <span>Teachers rate each skill for every student when entering scores.</span>
    </p>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <UiLabel class="text-xs">Skills</UiLabel>
        <div class="flex items-center gap-1">
          <UiButton
            type="button"
            variant="ghost"
            size="sm"
            :icon="ICONS.restore"
            text="Defaults"
            @click="restoreDefaults"
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

      <div v-for="(row, index) in config.rows" :key="row.id" class="flex items-center gap-1">
        <UiInput v-model="row.label" placeholder="Skill" class="h-8 flex-1 text-xs" />
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.up"
          :label="`Move skill ${index + 1} up`"
          :disabled="index === 0"
          @click="moveRow(index, -1)"
        />
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.down"
          :label="`Move skill ${index + 1} down`"
          :disabled="index === config.rows.length - 1"
          @click="moveRow(index, 1)"
        />
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.delete"
          :label="`Remove skill ${index + 1}`"
          class="text-destructive"
          @click="removeRow(index)"
        />
      </div>
    </div>
  </div>
</template>
