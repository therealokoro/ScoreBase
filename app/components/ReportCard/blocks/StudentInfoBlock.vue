<script lang="ts" setup>
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
      return `${view.totalStudents} students`
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
      return "border-border rounded-lg border p-3"
    case "bordered":
      // Outer border comes from the wrapper; cells draw the inner grid lines.
      return "border-border overflow-hidden rounded-lg border"
    default:
      return ""
  }
})

const bordered = computed(() => props.config.borderStyle === "bordered")

const valueStyle = computed(() => ({
  fontSize: `${props.config.valueFontSize}px`,
  fontWeight: props.config.valueFontWeight
}))
</script>

<template>
  <div data-block-type="student-info" :class="containerClass">
    <div
      v-if="items.length"
      class="grid"
      :class="bordered ? '' : 'gap-x-4 gap-y-2'"
      :style="gridStyle"
    >
      <div
        v-for="item in items"
        :key="item.id"
        :class="[
          bordered ? 'border-border border-r border-b p-2' : '',
          !bordered && config.labelPlacement === 'side' ? 'flex items-baseline gap-2' : '',
          !bordered && config.labelPlacement === 'top' ? 'space-y-0.5' : ''
        ]"
      >
        <p class="text-muted-foreground text-[10px]">{{ item.label }}</p>
        <p :style="valueStyle">{{ item.value }}</p>
      </div>
    </div>
  </div>
</template>
