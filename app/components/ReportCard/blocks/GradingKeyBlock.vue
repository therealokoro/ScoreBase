<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { GradingKeyConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: GradingKeyConfig
  data?: ReportCardData | null
  blockId?: string
}>()

// Grade data always comes live from result settings' KV gradeBoundaries — never stored here.
const { data: settings } = useGetResultSettings()

const boundaries = computed(() =>
  [...(settings.value?.gradeBoundaries ?? [])].sort((a, b) => b.min - a.min)
)
</script>

<template>
  <div data-block-type="grading-key" class="space-y-1">
    <p :style="textStyle(config.title.style)">{{ config.title.value }}</p>

    <!-- Bulleted list: "● A  Distinction - 70% and above" -->
    <ul
      v-if="config.displayStyle === 'list'"
      class="border-border w-fit space-y-0.5 rounded border px-2 py-1.5"
    >
      <li
        v-for="boundary in boundaries"
        :key="boundary.label"
        class="flex gap-1.5 text-[10px] leading-snug"
      >
        <span aria-hidden="true">●</span>
        <span>
          <span class="font-semibold">{{ boundary.label }}</span>
          <span v-if="boundary.remark"> {{ boundary.remark }} -</span>
          <span v-else> -</span>
          {{ boundary.min }}% and above
        </span>
      </li>
    </ul>

    <!-- Two-column table: chosen value, then the range on the right -->
    <div v-else class="border-border w-fit overflow-hidden rounded border">
      <UiTable class="w-fit text-[10px]">
        <UiTableBody>
          <UiTableRow v-for="boundary in boundaries" :key="boundary.label">
            <UiTableCell class="px-2 py-0.5 text-[10px]">
              {{ config.display === "grade" ? boundary.label : boundary.remark }}
            </UiTableCell>
            <UiTableCell class="px-2 py-0.5 text-right text-[10px] tabular-nums">
              {{ boundary.min }}–{{ boundary.max }}
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
