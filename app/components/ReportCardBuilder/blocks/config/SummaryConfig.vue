<script lang="ts" setup>
import type {
  LabelPlacement,
  SummaryConfig,
  SummaryMetric,
  SummaryStyle
} from "~~/shared/constants/report-card"

const config = defineModel<SummaryConfig>({ required: true })

const METRIC_OPTIONS: { value: SummaryMetric; label: string; description: string }[] = [
  {
    value: "marksObtainable",
    label: "Marks obtainable",
    description: "Total marks possible across all subjects"
  },
  { value: "marksObtained", label: "Marks obtained", description: "The student's total score" },
  {
    value: "subjectsOffered",
    label: "Subjects offered",
    description: "How many subjects were taken"
  },
  { value: "average", label: "Average", description: "Average score across subjects" },
  { value: "position", label: "Position", description: "The student's rank in the class" },
  { value: "positionOutOf", label: "Out of", description: "How many students were ranked" }
]

const styleOptions: { value: SummaryStyle; label: string }[] = [
  { value: "inline", label: "Row" },
  { value: "grid", label: "Two columns" }
]

const labelOptions: { value: LabelPlacement; label: string }[] = [
  { value: "top", label: "Label above the value" },
  { value: "side", label: "Label beside the value" }
]

function toggleMetric(metric: SummaryMetric, checked: boolean) {
  const metrics = config.value.metrics
  if (checked) {
    if (!metrics.includes(metric)) metrics.push(metric)
  } else {
    config.value.metrics = metrics.filter((item) => item !== metric)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <UiLabel class="text-xs">Layout</UiLabel>
      <div class="flex items-center gap-1">
        <UiButton
          v-for="option in styleOptions"
          :key="option.value"
          type="button"
          size="sm"
          :variant="config.style === option.value ? 'secondary' : 'ghost'"
          :text="option.label"
          @click="config.style = option.value"
        />
      </div>
    </div>

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Labels</UiLabel>
      <ReportCardBuilderSmallSelect v-model="config.labelPlacement" :options="labelOptions" />
    </div>

    <UiSeparator />

    <div class="space-y-2">
      <UiLabel class="text-xs">What to show</UiLabel>

      <div class="space-y-1">
        <label
          v-for="metric in METRIC_OPTIONS"
          :key="metric.value"
          class="flex items-start gap-2 rounded-md border border-border px-2 py-1.5"
        >
          <UiCheckbox
            :model-value="config.metrics.includes(metric.value)"
            :aria-label="metric.label"
            class="mt-0.5"
            @update:model-value="(value) => toggleMetric(metric.value, value === true)"
          />
          <span class="space-y-0.5">
            <span class="block text-xs">{{ metric.label }}</span>
            <span class="text-muted-foreground block text-[10px]">{{ metric.description }}</span>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
