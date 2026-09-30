<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { GradingKeyConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: GradingKeyConfig
  data?: ReportCardData | null
  blockId?: string
}>()

// The grading key always mirrors the current result settings — the admin never maintains
// grades in two places. The composable's placeholderData keeps this non-empty while loading.
const { data: settings } = useGetResultSettings()

const boundaries = computed(() =>
  [...(settings.value?.gradeBoundaries ?? [])].sort((a, b) => b.min - a.min)
)
</script>

<template>
  <div data-block-type="grading-key" class="space-y-2">
    <p :style="textStyle(config.title.style)">{{ config.title.value }}</p>

    <div class="border-border overflow-hidden rounded-lg border">
      <UiTable aria-label="Grading key">
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead>Grade</UiTableHead>
            <UiTableHead class="text-center">Min</UiTableHead>
            <UiTableHead class="text-center">Max</UiTableHead>
            <UiTableHead>Remark</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="boundary in boundaries" :key="boundary.label">
            <UiTableCell class="font-medium">{{ boundary.label }}</UiTableCell>
            <UiTableCell class="text-center tabular-nums">{{ boundary.min }}</UiTableCell>
            <UiTableCell class="text-center tabular-nums">{{ boundary.max }}</UiTableCell>
            <UiTableCell>{{ boundary.remark }}</UiTableCell>
          </UiTableRow>

          <UiTableRow v-if="boundaries.length === 0">
            <UiTableCell class="text-muted-foreground text-center text-sm">
              No grade boundaries configured
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
