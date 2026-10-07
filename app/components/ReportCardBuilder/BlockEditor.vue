<script lang="ts" setup>
import type { ReportCardEditorTab } from "~/composables/useReportCardTemplateEditor"
import type { ReportCardTemplate, Slot, WatermarkSource } from "~~/shared/constants/report-card"
import { FONT_FAMILIES } from "~~/shared/constants/report-card"

const template = defineModel<ReportCardTemplate>("template", { required: true })
const activeTab = defineModel<ReportCardEditorTab>("tab", { required: true })
const selectedBlockId = defineModel<string | null>("selectedBlockId", { required: true })

const TABS: { value: ReportCardEditorTab; label: string }[] = [
  { value: "general", label: "General" },
  { value: "header", label: "Header" },
  { value: "studentInfo", label: "Student Info" },
  { value: "main", label: "Main" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" }
]

const SLOT_TABS = TABS.filter((tab) => tab.value !== "general") as { value: Slot; label: string }[]

const fontOptions = FONT_FAMILIES.map((font) => ({ label: font.label, value: font.value }))

const sidebarSideOptions = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" }
]

/** The sidebar layout switches itself on as soon as the sidebar has a block. */
const hasSidebarBlocks = computed(() => template.value.sidebar.length > 0)

// ----------------------------------- Watermark -----------------------------------

type WatermarkMode = WatermarkSource | "off"

const watermarkMode = computed<WatermarkMode>({
  get: () => template.value.watermark?.source ?? "off",
  set: (value) => {
    if (value === "off") {
      template.value.watermark = null
      return
    }
    const current = template.value.watermark
    template.value.watermark = {
      source: value,
      imageUrl: current?.imageUrl ?? null,
      opacity: current?.opacity ?? 0.08,
      size: current?.size ?? "medium",
      mode: current?.mode ?? "single"
    }
  }
})
</script>

<template>
  <UiTabs
    :model-value="activeTab"
    @update:model-value="(value) => (activeTab = value as ReportCardEditorTab)"
  >
    <UiTabsList class="grid w-full grid-cols-3 gap-1">
      <UiTabsTrigger v-for="tab in TABS" :key="tab.value" :value="tab.value" class="text-xs">
        {{ tab.label }}
      </UiTabsTrigger>
    </UiTabsList>

    <!-- General: template-wide settings -->
    <UiTabsContent value="general" class="mt-3 space-y-5">
      <div class="space-y-1.5">
        <UiLabel class="text-xs">Font family</UiLabel>
        <ReportCardBuilderSmallSelect v-model="template.fontFamily" :options="fontOptions" />
        <p class="text-muted-foreground text-[10px]">
          Applies to every block. Individual blocks can override it.
        </p>
      </div>

      <div v-if="hasSidebarBlocks" class="space-y-1.5">
        <UiLabel class="text-xs">Sidebar side</UiLabel>
        <ReportCardBuilderSmallSelect
          v-model="template.sidebarPosition"
          :options="sidebarSideOptions"
          class="max-w-32"
        />
      </div>

      <UiSeparator />

      <div class="space-y-3">
        <UiLabel class="text-xs">Watermark</UiLabel>

        <UiRadioGroup v-model="watermarkMode" class="space-y-1.5">
          <label class="flex items-center gap-2 text-xs">
            <UiRadioGroupItem value="off" />
            Off
          </label>
          <label class="flex items-center gap-2 text-xs">
            <UiRadioGroupItem value="logo" />
            Use primary logo as watermark
          </label>
          <label class="flex items-center gap-2 text-xs">
            <UiRadioGroupItem value="custom" />
            Upload a custom image
          </label>
        </UiRadioGroup>

        <ReportCardBuilderAssetUpload
          v-if="watermarkMode === 'custom'"
          :model-value="template.watermark?.imageUrl ?? null"
          asset-key="watermark"
          label="Watermark image"
          @update:model-value="
            (value) => {
              if (template.watermark) template.watermark.imageUrl = value
            }
          "
        />

        <p v-if="watermarkMode === 'logo'" class="text-muted-foreground text-[10px]">
          The primary school logo is used. Upload one in the School Information block.
        </p>

        <template v-if="template.watermark">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground w-14 text-[10px]">Opacity</span>
            <UiSlider
              :model-value="[Math.round(template.watermark.opacity * 100)]"
              :min="0"
              :max="100"
              :step="1"
              @update:model-value="
                (value) => (template.watermark!.opacity = (value?.[0] ?? 8) / 100)
              "
            />
            <span class="w-8 text-right text-[10px] tabular-nums">
              {{ Math.round(template.watermark.opacity * 100) }}%
            </span>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground w-14 text-[10px]">Size</span>
            <UiButton
              v-for="size in ['small', 'medium', 'large'] as const"
              :key="size"
              type="button"
              size="sm"
              :variant="template.watermark.size === size ? 'secondary' : 'ghost'"
              :text="size.charAt(0).toUpperCase() + size.slice(1)"
              @click="template.watermark.size = size"
            />
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground w-14 text-[10px]">Mode</span>
            <UiButton
              type="button"
              size="sm"
              :variant="template.watermark.mode === 'single' ? 'secondary' : 'ghost'"
              text="Single"
              @click="template.watermark.mode = 'single'"
            />
            <UiButton
              type="button"
              size="sm"
              :variant="template.watermark.mode === 'tiled' ? 'secondary' : 'ghost'"
              text="Tiled"
              @click="template.watermark.mode = 'tiled'"
            />
          </div>
        </template>
      </div>
    </UiTabsContent>

    <!-- One tab per slot; each owns its block list -->
    <UiTabsContent v-for="tab in SLOT_TABS" :key="tab.value" :value="tab.value" class="mt-3">
      <ReportCardBuilderBlockSlotList
        :slot="tab.value"
        v-model:template="template"
        v-model:selected-block-id="selectedBlockId"
      />
    </UiTabsContent>
  </UiTabs>
</template>
