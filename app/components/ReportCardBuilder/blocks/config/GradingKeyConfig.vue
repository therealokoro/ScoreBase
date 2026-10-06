<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { GradingKeyConfig, GradingKeyDisplay } from "~~/shared/constants/report-card"

const config = defineModel<GradingKeyConfig>({ required: true })

const displayOptions: { value: GradingKeyDisplay; label: string }[] = [
  { value: "grade", label: "Show the grade" },
  { value: "remark", label: "Show the remark" }
]
</script>

<template>
  <div class="space-y-4">
    <ReportCardBuilderStyledTextInput
      v-model="config.title"
      label="Title"
      :min-size="9"
      :max-size="14"
    />

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Beside the score range</UiLabel>
      <UiRadioGroup v-model="config.display" class="space-y-1.5">
        <label
          v-for="option in displayOptions"
          :key="option.value"
          class="flex items-center gap-2 text-xs"
        >
          <UiRadioGroupItem :value="option.value" />
          {{ option.label }}
        </label>
      </UiRadioGroup>
    </div>

    <p class="bg-muted text-muted-foreground flex gap-2 rounded p-2 text-[10px]">
      <Icon :name="ICONS.info" class="mt-0.5 size-3 shrink-0" />
      <span>Grades always come from result settings, so they stay in sync automatically.</span>
    </p>
  </div>
</template>
