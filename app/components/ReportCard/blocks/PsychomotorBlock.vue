<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { PsychomotorConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: PsychomotorConfig
  data?: ReportCardData | null
  blockId?: string
}>()

function skillValue(): string {
  // TODO Phase 11: read ratings from manualValues — data.manualValues?.[blockId]?.[rowId]
  return "—"
}
</script>

<template>
  <div data-block-type="psychomotor" class="space-y-1.5">
    <p :style="textStyle(config.title.style)">{{ config.title.value }}</p>

    <div class="border-border overflow-hidden rounded-lg border">
      <UiTable class="text-xs" aria-label="Psychomotor skills">
        <UiTableBody>
          <UiTableRow v-for="row in config.rows" :key="row.id">
            <UiTableCell class="px-2 py-1 text-xs font-medium">{{ row.label }}</UiTableCell>
            <UiTableCell class="px-2 py-1 text-center text-xs">{{ skillValue() }}</UiTableCell>
          </UiTableRow>

          <UiTableRow v-if="config.rows.length === 0">
            <UiTableCell class="text-muted-foreground px-2 py-1 text-center text-xs">
              No skills configured
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
