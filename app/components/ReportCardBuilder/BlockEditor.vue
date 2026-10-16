<script lang="ts" setup>
import type { ReportCardTemplate, Slot, WatermarkSource } from "~~/shared/constants/report-card"
import {
  FONT_FAMILIES,
  WATERMARK_SIZE_DEFAULT,
  WATERMARK_SIZE_MAX,
  WATERMARK_SIZE_MIN
} from "~~/shared/constants/report-card"

import type { ReportCardEditorTab } from "~/composables/useReportCardTemplateEditor"

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

const footerLayoutOptions = [
  { value: "stacked", label: "Stacked" },
  { value: "columns", label: "Two columns" }
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
      size: current?.size ?? WATERMARK_SIZE_DEFAULT,
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

      <div v-if="template.footer.length > 0" class="space-y-1.5">
        <UiLabel class="text-xs">Footer layout</UiLabel>
        <ReportCardBuilderSmallSelect
          v-model="template.footerLayout"
          :options="footerLayoutOptions"
          class="max-w-40"
        />
        <p class="text-muted-foreground text-[10px]">
          Two columns shows footer blocks side by side. Set each footer block's column on the Footer
          tab.
        </p>
      </div>

      <div class="space-y-1.5">
        <UiLabel class="text-xs">Corner radius</UiLabel>
        <div class="flex items-center gap-2">
          <UiSlider
            :model-value="[template.borderRadius]"
            :min="0"
            :max="16"
            :step="1"
            @update:model-value="(value) => (template.borderRadius = value?.[0] ?? 0)"
          />
          <span class="w-8 text-right text-[10px] tabular-nums">
            {{ template.borderRadius }}px
          </span>
        </div>
        <p class="text-muted-foreground text-[10px]">
          Applies to the card's bordered boxes. 0 prints square corners, like a paper report card.
        </p>
      </div>

      <div class="space-y-2">
        <UiLabel class="text-xs">Table borders</UiLabel>
        <p class="text-muted-foreground text-[10px]">
          Every table and grid on the card: the scores table, the student details grid, the grading
          key and custom tables.
        </p>

        <div class="flex items-center gap-2">
          <span class="text-muted-foreground w-16 text-[10px]">Outline</span>
          <UiSlider
            :model-value="[template.tableBorders.outlineWidth]"
            :min="0"
            :max="4"
            :step="1"
            @update:model-value="(value) => (template.tableBorders.outlineWidth = value?.[0] ?? 1)"
          />
          <span class="w-6 text-right text-[10px] tabular-nums">
            {{ template.tableBorders.outlineWidth }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-muted-foreground w-16 text-[10px]">Inner lines</span>
          <UiSlider
            :model-value="[template.tableBorders.width]"
            :min="0"
            :max="4"
            :step="1"
            @update:model-value="(value) => (template.tableBorders.width = value?.[0] ?? 1)"
          />
          <span class="w-6 text-right text-[10px] tabular-nums">
            {{ template.tableBorders.width }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <span class="text-muted-foreground text-[10px]">Colour</span>
          <ReportCardBuilderColorPickerPopover
            v-model="template.tableBorders.color"
            label="Table border colour"
          />
        </div>
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

          <div class="flex items-center gap-2">
            <span class="text-muted-foreground w-14 text-[10px]">Size</span>
            <UiSlider
              :model-value="[template.watermark.size]"
              :min="WATERMARK_SIZE_MIN"
              :max="WATERMARK_SIZE_MAX"
              :step="10"
              @update:model-value="
                (value) => (template.watermark!.size = value?.[0] ?? WATERMARK_SIZE_DEFAULT)
              "
            />
            <span class="w-12 text-right text-[10px] tabular-nums">
              {{ template.watermark.size }}px
            </span>
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
