<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ReportCardTemplate } from "~~/shared/constants/report-card"
import { REPORT_CARD_SLOTS } from "~~/shared/constants/report-card"

import { getBlockDefinition } from "./blocks/registry"

const props = defineProps<{
  template: ReportCardTemplate
  data?: ReportCardData | null
  /**
   * Cap for the on-screen scale factor. `null` (or undefined with a null override) lets the A4
   * document fill the container width; a number caps it. Print output is always unscaled.
   */
  maxScale?: number | null
}>()

const A4_WIDTH_PX = 794 // 210mm at 96dpi

const container = useTemplateRef("container")
const { width: containerWidth } = useElementSize(container)
const scale = computed(() => {
  const raw = (containerWidth.value || A4_WIDTH_PX) / A4_WIDTH_PX
  return props.maxScale == null ? raw : Math.min(props.maxScale, raw)
})
</script>

<template>
  <div ref="container" class="w-full overflow-hidden">
    <div
      class="report-card-print-root bg-card text-card-foreground relative origin-top p-8 shadow-sm [transform:scale(var(--rc-scale))] print:transform-none"
      :style="{ '--rc-scale': String(scale), width: '210mm', minHeight: '297mm' }"
    >
      <div class="relative space-y-6">
        <template v-for="slotName in REPORT_CARD_SLOTS" :key="slotName">
          <template v-for="block in template[slotName]" :key="block.id">
            <component
              :is="getBlockDefinition(block.type).component"
              v-if="!block.hidden"
              :config="block.config"
              :data="data ?? null"
              :block-id="block.id"
            />
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
