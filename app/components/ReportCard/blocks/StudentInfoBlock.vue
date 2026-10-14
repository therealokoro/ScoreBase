<script lang="ts" setup>
import type { CSSProperties } from "vue"
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { StudentInfoConfig, StudentInfoField } from "~~/shared/constants/report-card"

import { resolveView } from "./placeholder"

const props = defineProps<{
  config: StudentInfoConfig
  data?: ReportCardData | null
  blockId?: string
}>()

function fieldValue(field: StudentInfoField): string {
  const view = resolveView(props.data)
  switch (field) {
    case "student.name":
      return view.studentName
    case "student.id":
      return view.studentSchoolId
    case "student.class":
      return view.className
    case "class.size":
      return String(view.totalStudents)
    case "term.name":
      return view.termName
    case "session.name":
      return view.sessionName
    case "result.average":
      return view.average !== null ? `${view.average}%` : "—"
    case "result.position":
      return view.position || "—"
    default:
      return "—"
  }
}

const items = computed(() =>
  props.config.fields.map((row) => ({
    id: row.id,
    label: row.label,
    value: fieldValue(row.field)
  }))
)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.config.columns}, minmax(0, 1fr))`
}))

const containerClass = computed(() => {
  switch (props.config.borderStyle) {
    case "outlined":
      return "border-foreground rounded-[var(--rc-radius)] border p-3"
    case "bordered":
      // Outer border comes from the wrapper; cells draw the inner grid lines. `border-foreground`
      // keeps the print output black like a paper report card.
      return "border-foreground overflow-hidden rounded-[var(--rc-radius)] border"
    default:
      return ""
  }
})

const bordered = computed(() => props.config.borderStyle === "bordered")

const borderWidth = computed(() => `${props.config.borderWidth}px`)

/** The wrapper draws the outer rule for the outlined and bordered styles. */
const containerStyle = computed<CSSProperties>(() =>
  props.config.borderStyle === "borderless" ? {} : { borderWidth: borderWidth.value }
)

/**
 * Cell classes for the bordered grid. The wrapper already draws the outer border, so the last
 * column and last row drop their inner lines — otherwise those edges print as a double rule.
 */
function cellClass(): string[] {
  return bordered.value ? ["border-foreground border-r border-b p-1.5"] : []
}

/** Same edge rule as `cellClass`, expressed as widths so `borderWidth` can scale them. */
function cellStyle(index: number): CSSProperties {
  if (!bordered.value) return {}
  const columns = props.config.columns
  const rows = Math.ceil(items.value.length / columns)
  const row = Math.floor(index / columns)
  return {
    borderRightWidth: (index + 1) % columns === 0 ? "0px" : borderWidth.value,
    borderBottomWidth: row === rows - 1 ? "0px" : borderWidth.value
  }
}

const valueStyle = computed(() => ({
  fontSize: `${props.config.valueFontSize}px`,
  fontWeight: props.config.valueFontWeight
}))
</script>

<template>
  <div data-block-type="student-info" :class="containerClass" :style="containerStyle">
    <div
      v-if="items.length"
      class="grid"
      :class="bordered ? '' : 'gap-x-4 gap-y-2'"
      :style="gridStyle"
    >
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :class="[
          ...cellClass(),
          !bordered && config.labelPlacement === 'side' ? 'flex items-baseline gap-2' : '',
          !bordered && config.labelPlacement === 'top' ? 'space-y-0.5' : ''
        ]"
        :style="cellStyle(index)"
      >
        <p class="text-muted-foreground text-[10px] break-words">{{ item.label }}</p>
        <p class="break-words" :style="valueStyle">{{ item.value }}</p>
      </div>
    </div>
  </div>
</template>
