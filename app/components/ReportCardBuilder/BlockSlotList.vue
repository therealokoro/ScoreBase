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

import { blockRegistry, getBlockDefinition } from "../ReportCard/blocks/registry"
import type { BlockDefinition } from "../ReportCard/blocks/registry"
import CustomTableConfigPanel from "./blocks/config/CustomTableConfig.vue"
import GradingKeyConfigPanel from "./blocks/config/GradingKeyConfig.vue"
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
  summary: SummaryConfigPanel,
  remarks: RemarksConfigPanel
}

const selectedBlockId = ref<string | null>(null)
const paletteOpen = ref(false)
const deleteDialogOpen = ref(false)
const pendingDeleteId = ref<string | null>(null)

const blocks = computed(() => template.value[props.slot])

const availableBlocks = computed(() =>
  Object.values(blockRegistry).filter((definition) => definition.allowedSlots.includes(props.slot))
)

function requirementSummary(definition: BlockDefinition): string {
  const parts: string[] = []
  if (definition.dataRequirements.computed.length > 0) {
    parts.push(`Uses ${definition.dataRequirements.computed.length} student data fields`)
  }
  if (definition.dataRequirements.manual.length > 0) {
    parts.push("Teachers fill in values for each student")
  }
  return parts.join(" · ") || "Layout or fixed content only"
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
    config: definition.defaultConfig()
  } as ReportCardBlock

  blocks.value.push(block)
  selectedBlockId.value = block.id
  paletteOpen.value = false
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
        <component :is="configPanels[block.type]" v-model="block.config" />
      </div>
    </div>

    <!-- Add block palette -->
    <div v-if="paletteOpen" class="space-y-2 rounded-lg border border-dashed border-border p-3">
      <p class="text-sm font-medium">Add a block</p>
      <button
        v-for="definition in availableBlocks"
        :key="definition.type"
        type="button"
        class="hover:bg-muted w-full rounded-md border border-border p-2 text-left transition-colors"
        @click="addBlock(definition)"
      >
        <span class="block text-sm font-medium">{{ definition.label }}</span>
        <span class="text-muted-foreground block text-xs">
          {{ requirementSummary(definition) }}
        </span>
      </button>
      <UiButton
        type="button"
        variant="ghost"
        size="sm"
        text="Cancel"
        @click="paletteOpen = false"
      />
    </div>

    <UiButton
      v-else
      type="button"
      variant="outline"
      size="sm"
      :icon="ICONS.add"
      text="Add block"
      block
      @click="paletteOpen = true"
    />

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
