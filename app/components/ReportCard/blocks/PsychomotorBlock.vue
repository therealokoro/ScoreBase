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
      <UiTable class="w-fit text-[9px]" aria-label="Psychomotor skills">
        <UiTableBody>
          <UiTableRow v-for="row in config.rows" :key="row.id">
            <UiTableCell class="px-1 py-0.5 text-[9px] font-medium">{{ row.label }}</UiTableCell>
            <UiTableCell class="px-1 py-0.5 text-center text-[9px]">{{ skillValue() }}</UiTableCell>
          </UiTableRow>

          <UiTableRow v-if="config.rows.length === 0">
            <UiTableCell class="text-muted-foreground px-1 py-0.5 text-center text-[9px]">
              No skills configured
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
