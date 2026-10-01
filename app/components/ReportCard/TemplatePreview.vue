<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ReportCardBlock, ReportCardTemplate } from "~~/shared/constants/report-card"
import { REPORT_CARD_SLOTS } from "~~/shared/constants/report-card"

import { getBlockDefinition } from "./blocks/registry"

const props = withDefaults(
  defineProps<{
    template: ReportCardTemplate
    data?: ReportCardData | null
    /**
     * Cap for the on-screen zoom factor. `null` lets the A4 document fill the container width; a
     * number caps it (default 1 for the builder preview). Zoom is layout-aware, so the page grows
     * with the document instead of clipping it. Print output is always unscaled — tailwind.css
     * resets zoom for `.report-card-print-root` in print.
     */
    maxScale?: number | null
  }>(),
  { maxScale: 1 }
)

const A4_WIDTH_PX = 794 // 210mm at 96dpi

const container = useTemplateRef("container")
const { width: containerWidth } = useElementSize(container)
const scale = computed(() => {
  const raw = (containerWidth.value || A4_WIDTH_PX) / A4_WIDTH_PX
  return props.maxScale == null ? raw : Math.min(props.maxScale, raw)
})

function assetUrl(pathname: string | null): string | null {
  return pathname ? `/images/${pathname}` : null
}

/** Finds the first visible block of a given type across all slots. */
function findBlock(type: ReportCardBlock["type"]): ReportCardBlock | null {
  const slots: ReportCardBlock[][] = [
    props.template.header,
    props.template.studentInfo,
    props.template.main,
    props.template.sidebar,
    props.template.footer
  ]
  return slots.flat().find((block) => block.type === type && !block.hidden) ?? null
}

// ----------------------------------- Watermark -----------------------------------

const WATERMARK_SIZE_PX = { small: 200, medium: 350, large: 500 } as const

const watermark = computed(() => props.template.watermark)

/** Resolves the watermark image: either the school-info logo or the uploaded custom image. */
const watermarkImageUrl = computed(() => {
  const mark = watermark.value
  if (!mark) return null
  if (mark.source === "logo") {
    const schoolInfo = findBlock("school-info")
    const primary = schoolInfo?.type === "school-info" ? schoolInfo.config.logoPrimary : null
    return assetUrl(primary)
  }
  return assetUrl(mark.imageUrl)
})

const watermarkSize = computed(() =>
  watermark.value ? WATERMARK_SIZE_PX[watermark.value.size] : WATERMARK_SIZE_PX.medium
)

// ----------------------------------- Layout -----------------------------------

const hasSidebar = computed(() => props.template.sidebar.length > 0)
</script>

<template>
  <div ref="container" class="w-full overflow-hidden">
    <div
      class="report-card-print-root bg-card text-card-foreground relative p-6 shadow-sm"
      :style="{ zoom: String(scale), width: '210mm', minHeight: '297mm' }"
    >
      <!-- Watermark (single: centred logo/image; tiled: repeated background) -->
      <div
        v-if="watermark && watermarkImageUrl"
        class="pointer-events-none absolute inset-0 select-none"
        :style="{ opacity: watermark.opacity }"
        aria-hidden="true"
      >
        <template v-if="watermark.mode === 'single'">
          <img
            :src="watermarkImageUrl"
            alt=""
            class="absolute inset-0 m-auto object-contain"
            :style="{ width: `${watermarkSize}px`, height: `${watermarkSize}px` }"
          />
        </template>
        <div
          v-else
          class="h-full w-full"
          :style="{
            backgroundImage: `url('${watermarkImageUrl}')`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${watermarkSize}px`
          }"
        />
      </div>

      <!-- All content sits above the watermark -->
      <div class="relative z-1 space-y-4">
        <!-- Full-width slots -->
        <template v-for="slotName in ['header', 'studentInfo'] as const" :key="slotName">
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

        <!-- Main (+ optional sidebar) -->
        <div
          v-if="hasSidebar"
          class="flex gap-4"
          :class="template.sidebarPosition === 'left' ? 'flex-row-reverse' : ''"
        >
          <div class="min-w-0 flex-[2] space-y-4">
            <template v-for="block in template.main" :key="block.id">
              <component
                :is="getBlockDefinition(block.type).component"
                v-if="!block.hidden"
                :config="block.config"
                :data="data ?? null"
                :block-id="block.id"
              />
            </template>
          </div>

          <aside class="min-w-0 flex-1 space-y-4">
            <template v-for="block in template.sidebar" :key="block.id">
              <component
                :is="getBlockDefinition(block.type).component"
                v-if="!block.hidden"
                :config="block.config"
                :data="data ?? null"
                :block-id="block.id"
              />
            </template>
          </aside>
        </div>

        <div v-else class="space-y-4">
          <template v-for="block in template.main" :key="block.id">
            <component
              :is="getBlockDefinition(block.type).component"
              v-if="!block.hidden"
              :config="block.config"
              :data="data ?? null"
              :block-id="block.id"
            />
          </template>
        </div>

        <!-- Footer -->
        <template v-for="block in template.footer" :key="block.id">
          <component
            :is="getBlockDefinition(block.type).component"
            v-if="!block.hidden"
            :config="block.config"
            :data="data ?? null"
            :block-id="block.id"
          />
        </template>
      </div>
    </div>
  </div>
</template>
