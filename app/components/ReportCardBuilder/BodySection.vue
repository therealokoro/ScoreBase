<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { ReportCardTemplate } from "~~/shared/constants/report-card"

const model = defineModel<ReportCardTemplate>("template", { required: true })

// Phase 6: the template became a slot + block shape; this legacy fixed-shape view is kept
// ONLY so the old section UI keeps compiling until Phase 10 replaces it. Every reference to
// `legacy` below is a known-stale code path.
type LegacyTemplate = {
  header: {
    logoPlacement: "left" | "center" | "right" | "left-right"
    logoPrimary: string | null
    logoSecondary: string | null
    showWatermark: boolean
    watermarkOpacity: number
    heading: string
    subheading: string
    paragraphs: {
      id: string
      text: string
      fontSize: number
      color: string
      bold: boolean
      align: "left" | "center" | "right"
    }[]
    info: { student: boolean; class: boolean; session: boolean; term: boolean; order: string[] }
  }
  body: {
    columns: {
      subject: true
      caBreakdown: boolean
      caTotal: boolean
      exam: boolean
      total: boolean
      grade: boolean
      remark: boolean
    }
  }
}

// Phase 6→10 bridge: the template is now the slot + block shape, so this legacy fixed-shape
// view is a frozen empty skeleton. The controls below are inert until Phase 10 replaces them
// with the block editor; the live preview is handled by TemplatePreview.vue.
const EMPTY_LEGACY_TEMPLATE: LegacyTemplate = {
  header: {
    logoPlacement: "left",
    logoPrimary: null,
    logoSecondary: null,
    showWatermark: false,
    watermarkOpacity: 0.08,
    heading: "",
    subheading: "",
    paragraphs: [],
    info: { student: true, class: true, session: true, term: true, order: [] }
  },
  body: {
    columns: {
      subject: true,
      caBreakdown: false,
      caTotal: true,
      exam: true,
      total: true,
      grade: true,
      remark: true
    }
  }
}

const legacy = computed(() => structuredClone(EMPTY_LEGACY_TEMPLATE))

type ColumnKey = keyof LegacyTemplate["body"]["columns"]
type ToggleKey = Exclude<ColumnKey, "subject">

const toggles: { key: ToggleKey; label: string; description: string }[] = [
  {
    key: "caBreakdown",
    label: "CA Breakdown",
    description: "Show individual CA1, CA2... columns"
  },
  { key: "caTotal", label: "CA Total", description: "Show a merged total CA column" },
  { key: "exam", label: "Exam score", description: "Show the exam score column" },
  { key: "total", label: "Total score", description: "Show the subject total column" },
  { key: "grade", label: "Grade", description: "Show the grade column" },
  { key: "remark", label: "Remark", description: "Show the remark column" }
]

function setColumn(key: ToggleKey, value: boolean) {
  legacy.value.body.columns[key] = value
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <UiHeading :level="6" class="font-semibold">Score table columns</UiHeading>
      <p class="text-xs text-muted-foreground">
        Choose which columns appear in the subject score table.
      </p>
    </div>

    <div class="space-y-2">
      <!-- Subject is always shown -->
      <div class="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2">
        <div class="space-y-0.5">
          <p class="text-sm font-medium">Subject</p>
          <p class="text-xs text-muted-foreground">Always visible — cannot be hidden</p>
        </div>

        <UiTooltip>
          <UiTooltipTrigger as-child>
            <span class="inline-flex">
              <UiSwitch :model-value="true" disabled aria-label="Subject column is always shown" />
            </span>
          </UiTooltipTrigger>
          <UiTooltipContent>Subject column is always shown.</UiTooltipContent>
        </UiTooltip>
      </div>

      <div
        v-for="row in toggles"
        :key="row.key"
        class="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
      >
        <div class="space-y-0.5">
          <p class="text-sm font-medium">{{ row.label }}</p>
          <p class="text-xs text-muted-foreground">{{ row.description }}</p>
        </div>

        <UiSwitch
          :model-value="legacy.body.columns[row.key]"
          :aria-label="`Show ${row.label}`"
          @update:model-value="(value) => setColumn(row.key, value)"
        />
      </div>
    </div>

    <div class="bg-muted text-muted-foreground flex gap-2 rounded p-3 text-xs">
      <Icon :name="ICONS.info" class="mt-0.5 size-3.5 shrink-0" />
      <p>
        CA Breakdown and CA Total are independent. You can show both, either, or neither. When both
        are off, all CA columns are hidden.
      </p>
    </div>
  </div>
</template>
