<script lang="ts" setup>
import type { ReportCardTemplate, Slot } from "~~/shared/constants/report-card"

const template = defineModel<ReportCardTemplate>("template", { required: true })

const SLOT_TABS: { value: Slot; label: string }[] = [
  { value: "header", label: "Header" },
  { value: "studentInfo", label: "Student Info" },
  { value: "main", label: "Main" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" }
]

const sidebarDisabled = computed(() => template.value.layout === "full")

const layout = computed({
  get: () => template.value.layout,
  set: (value: "full" | "sidebar") => {
    template.value.layout = value
    if (value === "full") {
      // The schema requires an empty sidebar with no position when the layout is full.
      template.value.sidebarPosition = null
      template.value.sidebar = []
    } else {
      template.value.sidebarPosition = template.value.sidebarPosition ?? "right"
    }
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Template-level controls -->
    <div class="space-y-4">
      <div class="space-y-2">
        <UiLabel for="rc-template-name">Template name</UiLabel>
        <UiInput
          id="rc-template-name"
          v-model="template.name"
          placeholder="e.g. Terminal Report Card"
        />
      </div>

      <div class="space-y-2">
        <UiLabel>Layout</UiLabel>
        <div class="flex items-center gap-1">
          <UiButton
            type="button"
            size="sm"
            :variant="template.layout === 'full' ? 'secondary' : 'ghost'"
            text="Full width"
            @click="layout = 'full'"
          />
          <UiButton
            type="button"
            size="sm"
            :variant="template.layout === 'sidebar' ? 'secondary' : 'ghost'"
            text="With sidebar"
            @click="layout = 'sidebar'"
          />
        </div>

        <div v-if="template.layout === 'sidebar'" class="flex items-center gap-1">
          <span class="text-muted-foreground text-xs">Sidebar side</span>
          <UiButton
            type="button"
            size="sm"
            :variant="template.sidebarPosition === 'left' ? 'secondary' : 'ghost'"
            text="Left"
            @click="template.sidebarPosition = 'left'"
          />
          <UiButton
            type="button"
            size="sm"
            :variant="template.sidebarPosition === 'right' ? 'secondary' : 'ghost'"
            text="Right"
            @click="template.sidebarPosition = 'right'"
          />
        </div>
      </div>

      <div class="space-y-3 rounded-lg border border-border p-3">
        <UiLabel>Watermark</UiLabel>
        <ReportCardBuilderAssetUpload
          :model-value="template.watermark?.imageUrl ?? null"
          asset-key="watermark"
          label="Watermark image"
          @update:model-value="
            (value) =>
              (template.watermark = value
                ? {
                    imageUrl: value,
                    opacity: template.watermark?.opacity ?? 0.08,
                    size: template.watermark?.size ?? 'medium',
                    mode: template.watermark?.mode ?? 'single'
                  }
                : null)
          "
        />

        <template v-if="template.watermark">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground w-16 text-xs">Opacity</span>
            <UiSlider
              :model-value="[Math.round(template.watermark.opacity * 100)]"
              :min="0"
              :max="100"
              :step="1"
              @update:model-value="
                (value) => (template.watermark!.opacity = (value?.[0] ?? 8) / 100)
              "
            />
            <span class="w-10 text-right text-xs tabular-nums">
              {{ Math.round(template.watermark.opacity * 100) }}%
            </span>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-muted-foreground w-16 text-xs">Size</span>
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
            <span class="text-muted-foreground w-16 text-xs">Mode</span>
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
    </div>

    <UiSeparator />

    <!-- Slot tabs (reka drives the switching; each slot owns its block list) -->
    <UiTabs default-value="header">
      <UiTabsList class="grid w-full grid-cols-5">
        <template v-for="tab in SLOT_TABS" :key="tab.value">
          <UiTooltip v-if="tab.value === 'sidebar' && sidebarDisabled">
            <UiTooltipTrigger as-child>
              <span class="w-full">
                <UiTabsTrigger :value="tab.value" disabled class="w-full opacity-50" @click.prevent>
                  {{ tab.label }}
                </UiTabsTrigger>
              </span>
            </UiTooltipTrigger>
            <UiTooltipContent>
              Switch the layout to "With sidebar" to use the sidebar.
            </UiTooltipContent>
          </UiTooltip>

          <UiTabsTrigger v-else :value="tab.value" class="w-full">
            {{ tab.label }}
          </UiTabsTrigger>
        </template>
      </UiTabsList>

      <UiTabsContent v-for="tab in SLOT_TABS" :key="tab.value" :value="tab.value" class="mt-4">
        <ReportCardBuilderBlockSlotList :slot="tab.value" v-model:template="template" />
      </UiTabsContent>
    </UiTabs>
  </div>
</template>
