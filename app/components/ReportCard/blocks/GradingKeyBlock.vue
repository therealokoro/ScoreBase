<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { GradingKeyConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: GradingKeyConfig
  data?: ReportCardData | null
  blockId?: string
}>()

// Rows are seeded from result settings when the block is added, then editable per template.
const rows = computed(() => [...props.config.rows].sort((a, b) => b.min - a.min))
</script>

<template>
  <div data-block-type="grading-key" class="space-y-1.5">
    <p :style="textStyle(config.title.style)">{{ config.title.value }}</p>

    <div class="border-border overflow-hidden rounded-lg border">
      <UiTable class="text-xs" aria-label="Grading key">
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead class="h-8 px-2 text-xs">Grade</UiTableHead>
            <UiTableHead class="h-8 px-2 text-center text-xs">Range</UiTableHead>
            <UiTableHead class="h-8 px-2 text-xs">Remark</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="row in rows" :key="row.id">
            <UiTableCell class="px-2 py-1 text-xs font-medium">{{ row.label }}</UiTableCell>
            <UiTableCell class="px-2 py-1 text-center text-xs tabular-nums">
              {{ row.min }}–{{ row.max }}
            </UiTableCell>
            <UiTableCell class="px-2 py-1 text-xs">{{ row.remark }}</UiTableCell>
          </UiTableRow>

          <UiTableRow v-if="rows.length === 0">
            <UiTableCell class="text-muted-foreground px-2 py-1 text-center text-xs">
              No grades configured
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
