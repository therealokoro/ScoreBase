<script lang="ts" setup>
import type { Component } from "vue"
import { ICONS } from "~~/shared/constants/icons"
import type { BlockType, ReportCardTemplate, Slot } from "~~/shared/constants/report-card"
import { FONT_FAMILIES } from "~~/shared/constants/report-card"

import { getBlockDefinition } from "../ReportCard/blocks/registry"

const fontOptions = [
  { label: "Use the general font", value: "inherit" },
  ...FONT_FAMILIES.map((font) => ({ label: font.label, value: font.value }))
]

const columnOptions = [
  { value: "full", label: "Full width" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" }
]
import CustomTableConfigPanel from "./blocks/config/CustomTableConfig.vue"
import GradingKeyConfigPanel from "./blocks/config/GradingKeyConfig.vue"
import PsychomotorConfigPanel from "./blocks/config/PsychomotorConfig.vue"
import RemarksConfigPanel from "./blocks/config/RemarksConfig.vue"
import SchoolInfoConfigPanel from "./blocks/config/SchoolInfoConfig.vue"
import ScoresConfigPanel from "./blocks/config/ScoresConfig.vue"
import StudentInfoConfigPanel from "./blocks/config/StudentInfoConfig.vue"
import SummaryConfigPanel from "./blocks/config/SummaryConfig.vue"

const props = defineProps<{ slot: Slot }>()

const template = defineModel<ReportCardTemplate>("template", { required: true })

const configPanels: Record<BlockType, Component> = {
  "school-info": SchoolInfoConfigPanel,
  "student-info": StudentInfoConfigPanel,
  scores: ScoresConfigPanel,
  "custom-table": CustomTableConfigPanel,
  "grading-key": GradingKeyConfigPanel,
  psychomotor: PsychomotorConfigPanel,
  summary: SummaryConfigPanel,
  remarks: RemarksConfigPanel
}

const selectedBlockId = defineModel<string | null>("selectedBlockId", { required: true })

const blocks = computed(() => template.value[props.slot])

function selectBlock(id: string) {
  selectedBlockId.value = selectedBlockId.value === id ? null : id
}

function moveBlock(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= blocks.value.length) return
  const [item] = blocks.value.splice(index, 1)
  if (item) blocks.value.splice(target, 0, item)
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="blocks.length === 0" class="text-muted-foreground text-xs">
      No blocks in this slot yet.
    </p>

    <div
      v-for="(block, index) in blocks"
      :key="block.id"
      class="rounded-lg border"
      :class="[
        block.id === selectedBlockId ? 'border-primary' : 'border-border',
        block.hidden ? 'opacity-60' : ''
      ]"
    >
      <div class="flex items-center gap-1 p-2">
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="block.hidden ? ICONS.hide : ICONS.view"
          :label="block.hidden ? 'Show this block' : 'Hide this block'"
          @click="block.hidden = !block.hidden"
        />

        <button
          type="button"
          class="flex-1 rounded px-1 text-left text-sm font-medium"
          @click="selectBlock(block.id)"
        >
          {{ getBlockDefinition(block.type).label }}
          <span v-if="block.hidden" class="text-muted-foreground font-normal">(hidden)</span>
        </button>

        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.up"
          label="Move up"
          :disabled="index === 0"
          @click="moveBlock(index, -1)"
        />
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.down"
          label="Move down"
          :disabled="index === blocks.length - 1"
          @click="moveBlock(index, 1)"
        />
      </div>

      <div v-if="block.id === selectedBlockId" class="space-y-3 border-t border-border p-3">
        <div class="space-y-1.5">
          <UiLabel class="text-xs">Font family</UiLabel>
          <ReportCardBuilderSmallSelect
            :model-value="block.fontFamily ?? 'inherit'"
            :options="fontOptions"
            placeholder="Use the general font"
            @update:model-value="(value) => (block.fontFamily = value === 'inherit' ? null : value)"
          />
        </div>

        <div v-if="slot === 'footer' && template.footerLayout === 'columns'" class="space-y-1.5">
          <UiLabel class="text-xs">Column</UiLabel>
          <ReportCardBuilderSmallSelect
            v-model="block.column"
            :options="columnOptions"
            class="max-w-40"
          />
          <p class="text-muted-foreground text-[10px]">
            Full width spans both columns; left and right stack in their own column.
          </p>
        </div>

        <component :is="configPanels[block.type]" v-model="block.config" />
      </div>
    </div>
  </div>
</template>
