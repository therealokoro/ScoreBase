<script lang="ts" setup>
import { typeid } from "typeid-js"
import type { Component } from "vue"
import { ICONS } from "~~/shared/constants/icons"
import type {
  BlockType,
  ReportCardBlock,
  ReportCardTemplate,
  Slot
} from "~~/shared/constants/report-card"
import { FONT_FAMILIES } from "~~/shared/constants/report-card"

import { blockRegistry, getBlockDefinition } from "../ReportCard/blocks/registry"
import type { BlockDefinition } from "../ReportCard/blocks/registry"

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
const deleteDialogOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)

const blocks = computed(() => template.value[props.slot])

const availableBlocks = computed(() =>
  Object.values(blockRegistry).filter((definition) => definition.allowedSlots.includes(props.slot))
)

const blockOptions = computed(() =>
  availableBlocks.value.map((definition) => ({
    label: definition.label,
    value: definition.type
  }))
)

/** Always reset to empty: picking an option adds the block straight away. */
const paletteChoice = ref("")

function addChosenBlock(type: string) {
  const definition = availableBlocks.value.find((item) => item.type === type)
  if (definition) addBlock(definition)
  paletteChoice.value = ""
}

function selectBlock(id: string) {
  selectedBlockId.value = selectedBlockId.value === id ? null : id
}

function addBlock(definition: BlockDefinition) {
  // The registry guarantees the (type, config) pairing; the union can't express it generically.
  const block = {
    id: typeid("block").toString(),
    type: definition.type,
    hidden: false,
    fontFamily: null,
    column: "full",
    config: definition.defaultConfig()
  } as ReportCardBlock

  blocks.value.push(block)
  selectedBlockId.value = block.id
}

function duplicateBlock(index: number) {
  const source = blocks.value[index]
  if (!source) return

  const copy = {
    ...structuredClone(toRaw(source)),
    id: typeid("block").toString()
  } as ReportCardBlock

  blocks.value.splice(index + 1, 0, copy)
  selectedBlockId.value = copy.id
}

function moveBlock(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= blocks.value.length) return
  const [item] = blocks.value.splice(index, 1)
  if (item) blocks.value.splice(target, 0, item)
}

function requestDelete(id: string) {
  pendingDeleteId.value = id
  deleteDialogOpen.value = true
}

function confirmDelete() {
  const index = blocks.value.findIndex((block) => block.id === pendingDeleteId.value)
  if (index >= 0) blocks.value.splice(index, 1)
  if (selectedBlockId.value === pendingDeleteId.value) selectedBlockId.value = null
  pendingDeleteId.value = null
  deleteDialogOpen.value = false
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
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.duplicate"
          label="Duplicate"
          @click="duplicateBlock(index)"
        />
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          :icon="ICONS.delete"
          label="Remove"
          class="text-destructive"
          @click="requestDelete(block.id)"
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

    <!-- Add block — a compact select listing what this slot allows -->
    <div class="space-y-1.5 rounded-lg border border-dashed border-border p-2">
      <p class="text-xs font-medium">Add a block</p>
      <ReportCardBuilderSmallSelect
        v-model="paletteChoice"
        :options="blockOptions"
        placeholder="Choose a block…"
        @update:model-value="addChosenBlock"
      />
    </div>

    <!-- Delete confirmation -->
    <UiAlertDialog v-model:open="deleteDialogOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Remove this block?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            The block and its settings will be removed from this template.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel />
          <UiAlertDialogAction variant="destructive" @click="confirmDelete">
            Remove
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
