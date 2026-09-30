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
    case "result.positionOutOf":
      return `out of ${view.totalStudents}`
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
      return "border-border rounded-lg border p-4"
    case "shaded-labels":
      return "bg-muted/40 rounded-lg p-4"
    default:
      return ""
  }
})
</script>

<template>
  <div data-block-type="student-info" :class="containerClass">
    <div v-if="items.length" class="grid gap-4 text-sm" :style="gridStyle">
      <div v-for="item in items" :key="item.id">
        <p
          :class="
            config.borderStyle === 'shaded-labels'
              ? 'text-muted-foreground bg-background rounded px-1.5 py-0.5 text-xs'
              : 'text-muted-foreground text-xs'
          "
        >
          {{ item.label }}
        </p>
        <p class="font-semibold">{{ item.value }}</p>
      </div>
    </div>
  </div>
</template>
