<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type {
  RemarksBlock as RemarksBlockType,
  ReportCardBlock,
  ReportCardTemplate
} from "~~/shared/constants/report-card"
import { REPORT_CARD_SLOTS, WATERMARK_SIZE_DEFAULT } from "~~/shared/constants/report-card"

import { getBlockDefinition } from "./blocks/registry"
import RemarksBlock from "./blocks/RemarksBlock.vue"

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

const watermarkSize = computed(() => watermark.value?.size ?? WATERMARK_SIZE_DEFAULT)

// ----------------------------------- Layout -----------------------------------

const hasSidebar = computed(() => props.template.sidebar.length > 0)

/**
 * Footer rows for the `"columns"` layout: consecutive `full` blocks stack as their own row, while
 * consecutive `left`/`right` blocks share a two-column row. Visible blocks only.
 */
type FooterRow =
  | { kind: "full"; blocks: ReportCardBlock[] }
  | { kind: "columns"; left: ReportCardBlock[]; right: ReportCardBlock[] }

const footerRows = computed<FooterRow[]>(() => {
  const rows: FooterRow[] = []
  for (const block of props.template.footer) {
    if (block.hidden) continue

    if (block.column === "full") {
      const last = rows.at(-1)
      if (last?.kind === "full") last.blocks.push(block)
      else rows.push({ kind: "full", blocks: [block] })
      continue
    }

    const last = rows.at(-1)
    const row: FooterRow =
      last?.kind === "columns" ? last : { kind: "columns", left: [], right: [] }
    if (row !== last) rows.push(row)
    if (block.column === "left") row.left.push(block)
    else row.right.push(block)
  }
  return rows
})

/**
 * Full-width remarks blocks in a two-column footer. Their head signature is drawn at the end of the
 * right column instead of under the teacher row, so it prints below the term-info table — the block
 * still owns one config, it is just rendered in two places.
 */
const splitRemarksBlocks = computed<RemarksBlockType[]>(() => {
  if (props.template.footerLayout !== "columns") return []
  if (!footerRows.value.some((row) => row.kind === "columns")) return []
  return props.template.footer.filter(
    (block): block is RemarksBlockType =>
      block.type === "remarks" && !block.hidden && block.column === "full"
  )
})

const splitRemarks = computed(() => splitRemarksBlocks.value.length > 0)
</script>

<template>
  <div ref="container" class="w-full overflow-hidden">
    <div
      class="report-card-print-root bg-card text-card-foreground relative p-6 shadow-sm"
      :style="{
        zoom: String(scale),
        width: '210mm',
        minHeight: '297mm',
        fontFamily: template.fontFamily,
        '--rc-radius': `${template.borderRadius}px`,
        '--rc-border-color': template.tableBorders.color,
        '--rc-border-width': `${template.tableBorders.width}px`,
        '--rc-outline-width': `${template.tableBorders.outlineWidth}px`
      }"
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
            <div v-if="!block.hidden" :style="{ fontFamily: block.fontFamily ?? undefined }">
              <component
                :is="getBlockDefinition(block.type).component"
                :config="block.config"
                :data="data ?? null"
                :block-id="block.id"
              />
            </div>
          </template>
        </template>

        <!-- Main (+ optional sidebar) -->
        <div
          v-if="hasSidebar"
          class="flex gap-3"
          :class="template.sidebarPosition === 'left' ? 'flex-row-reverse' : ''"
        >
          <div class="min-w-0 flex-1 space-y-4">
            <template v-for="block in template.main" :key="block.id">
              <div v-if="!block.hidden" :style="{ fontFamily: block.fontFamily ?? undefined }">
                <component
                  :is="getBlockDefinition(block.type).component"
                  :config="block.config"
                  :data="data ?? null"
                  :block-id="block.id"
                />
              </div>
            </template>
          </div>

          <!-- As narrow as the content allows -->
          <aside class="w-[30%] max-w-44 shrink-0 space-y-3">
            <template v-for="block in template.sidebar" :key="block.id">
              <div v-if="!block.hidden" :style="{ fontFamily: block.fontFamily ?? undefined }">
                <component
                  :is="getBlockDefinition(block.type).component"
                  :config="block.config"
                  :data="data ?? null"
                  :block-id="block.id"
                />
              </div>
            </template>
          </aside>
        </div>

        <div v-else class="space-y-4">
          <template v-for="block in template.main" :key="block.id">
            <div v-if="!block.hidden" :style="{ fontFamily: block.fontFamily ?? undefined }">
              <component
                :is="getBlockDefinition(block.type).component"
                :config="block.config"
                :data="data ?? null"
                :block-id="block.id"
              />
            </div>
          </template>
        </div>

        <!-- Footer: stacked, or two columns (e.g. grading key left / term info right) -->
        <template v-if="template.footerLayout === 'columns'">
          <template v-for="(row, rowIndex) in footerRows" :key="rowIndex">
            <div v-if="row.kind === 'full'" class="space-y-4">
              <template v-for="block in row.blocks" :key="block.id">
                <div :style="{ fontFamily: block.fontFamily ?? undefined }">
                  <!-- Split remarks: the teacher row keeps the full width here, its head signature
                       closes the right column so it prints under the term-info table. -->
                  <RemarksBlock
                    v-if="splitRemarks && block.type === 'remarks'"
                    :config="block.config"
                    :data="data ?? null"
                    :block-id="block.id"
                    part="teacher"
                  />
                  <component
                    v-else
                    :is="getBlockDefinition(block.type).component"
                    :config="block.config"
                    :data="data ?? null"
                    :block-id="block.id"
                  />
                </div>
              </template>
            </div>

            <div v-else class="flex items-start gap-4">
              <div class="min-w-0 flex-1 space-y-3">
                <template v-for="block in row.left" :key="block.id">
                  <div :style="{ fontFamily: block.fontFamily ?? undefined }">
                    <component
                      :is="getBlockDefinition(block.type).component"
                      :config="block.config"
                      :data="data ?? null"
                      :block-id="block.id"
                    />
                  </div>
                </template>
              </div>

              <div class="min-w-0 flex-1 space-y-3">
                <template v-for="block in row.right" :key="block.id">
                  <div :style="{ fontFamily: block.fontFamily ?? undefined }">
                    <component
                      :is="getBlockDefinition(block.type).component"
                      :config="block.config"
                      :data="data ?? null"
                      :block-id="block.id"
                    />
                  </div>
                </template>

                <!-- Head signatures of the split remarks blocks, under the right column's content -->
                <template v-for="block in splitRemarksBlocks" :key="`head-${block.id}`">
                  <div :style="{ fontFamily: block.fontFamily ?? undefined }">
                    <RemarksBlock
                      :config="block.config"
                      :data="data ?? null"
                      :block-id="block.id"
                      part="director"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <template v-for="block in template.footer" :key="block.id">
            <div v-if="!block.hidden" :style="{ fontFamily: block.fontFamily ?? undefined }">
              <component
                :is="getBlockDefinition(block.type).component"
                :config="block.config"
                :data="data ?? null"
                :block-id="block.id"
              />
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
