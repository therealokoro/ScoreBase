<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { CustomTableConfig, CustomTableRow } from "~~/shared/constants/report-card"

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

/**
 * Groups the rows into printed lines for the inline layout. A row with `newLine` starts a fresh
 * line, so several label/value pairs can share one bordered table (fee strip on line 1, the
 * next-term date on line 2) instead of rendering as separate tables.
 */
const inlineLines = computed<CustomTableRow[][]>(() => {
  const lines: CustomTableRow[][] = []
  for (const row of props.config.rows) {
    const current = lines.at(-1)
    if (!current || row.newLine) lines.push([row])
    else current.push(row)
  }
  return lines
})
</script>

<template>
  <div data-block-type="custom-table" class="space-y-1.5">
    <p v-if="config.title.value" :style="textStyle(config.title.style)">
      {{ config.title.value }}
    </p>

    <!-- Inline: label/value pairs across one or more lines inside a single bordered table -->
    <div
      v-if="config.layout === 'inline'"
      class="border-border w-fit overflow-hidden rounded-[var(--rc-radius)] border"
    >
      <div
        v-for="(line, lineIndex) in inlineLines"
        :key="lineIndex"
        class="flex w-full"
        :class="lineIndex > 0 ? 'border-border border-t' : ''"
      >
        <template v-for="(row, rowIndex) in line" :key="row.id">
          <div class="border-border bg-muted/40 border-r px-2 py-1 text-[10px] font-medium">
            {{ row.label }}
          </div>
          <div
            class="border-border px-2 py-1 text-[10px]"
            :class="rowIndex === line.length - 1 ? 'flex-1' : 'border-r'"
          >
            {{ rowValue(row.id) }}
          </div>
        </template>
      </div>
    </div>

    <!-- Stacked: one label/value row per entry -->
    <div v-else class="border-border w-fit overflow-hidden rounded-[var(--rc-radius)] border">
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
