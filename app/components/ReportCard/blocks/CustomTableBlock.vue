<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { CustomTableConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: CustomTableConfig
  data?: ReportCardData | null
  blockId?: string
}>()

function rowValue(rowId: string): string {
  if (props.config.variant === "static") {
    return props.config.rows.find((row) => row.id === rowId)?.value || "—"
  }

  // TODO Phase 11: read from manualValues — data.manualValues?.[blockId]?.[rowId]
  return "—"
}
</script>

<template>
  <div data-block-type="custom-table" class="space-y-1.5">
    <p v-if="config.title.value" :style="textStyle(config.title.style)">
      {{ config.title.value }}
    </p>

    <!-- Inline strip: alternating label/value cells across one row -->
    <div
      v-if="config.layout === 'inline'"
      class="border-border w-fit overflow-hidden rounded-lg border"
    >
      <div class="flex flex-wrap">
        <template v-for="row in config.rows" :key="row.id">
          <div class="border-border border-r px-2 py-1 text-[10px] font-medium last:border-r-0">
            {{ row.label }}
          </div>
          <div class="border-border border-r px-2 py-1 text-[10px] last:border-r-0">
            {{ rowValue(row.id) }}
          </div>
        </template>
      </div>
    </div>

    <!-- Stacked: one label/value row per entry -->
    <div v-else class="border-border w-fit overflow-hidden rounded-lg border">
      <UiTable class="w-fit text-xs" aria-label="Custom table">
        <UiTableBody>
          <UiTableRow v-for="row in config.rows" :key="row.id">
            <UiTableCell class="px-2 py-1 text-xs font-medium">{{ row.label }}</UiTableCell>
            <UiTableCell class="px-2 py-1 text-right text-xs">{{ rowValue(row.id) }}</UiTableCell>
          </UiTableRow>

          <UiTableRow v-if="config.rows.length === 0">
            <UiTableCell class="text-muted-foreground px-2 py-1 text-center text-xs">
              No rows configured
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
