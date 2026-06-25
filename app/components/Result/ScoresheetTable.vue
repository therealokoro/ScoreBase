<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"
import type { ResultWithDetail } from "~~/shared/validators/scoresheet"

import UiButton from "~/components/Ui/Button.vue"
import UiProgress from "~/components/Ui/Progress/Progress.vue"

type ScoresheetRow = {
  id: string
  student: { id: string; name: string; studentId: string } | null
  totalSubjects: number
  completedSubjects: number
  progress: number
}

const props = defineProps<{ result: ResultWithDetail; loading?: boolean }>()

// Per-scoresheet completion — fraction of subject scores that are fully
// entered (both CAs and exam filled in) out of total subjects on the sheet
// ---------------------------------------------------------------------------

const { isScoreComplete } = useScoresheetHelpers()

const scoresheets = computed(() => {
  return (props.result?.scoresheets ?? []).map((sheet) => {
    const total = sheet.subjectScores.length
    const completed = sheet.subjectScores.filter(isScoreComplete).length
    return {
      ...sheet,
      totalSubjects: total,
      completedSubjects: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      isFullyScored: total > 0 && completed === total
    }
  })
})

const globalSearch = ref("")
const columnHelper = createColumnHelper<ScoresheetRow>()
const columns = [
  // Serial number — stays correct across pages
  columnHelper.display({
    id: "serial",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      return pageIndex * pageSize + row.index + 1
    }
  }),

  // Student name — links to the score entry page for that scoresheet
  columnHelper.accessor((row) => row.student?.name ?? "Unknown student", {
    id: "studentName",
    header: "Student",
    cell: ({ row }) => {
      return h(
        UiButton,
        {
          variant: "link",
          to: `/dashboard/results/${props.result.id}/${row.original.id}`,
          class: "text-xs md:text-sm font-medium"
        },
        () => row.original.student?.name ?? "Unknown student"
      )
    }
  }),

  // Student ID — secondary identifying info, hidden on small screens via columnVisibility
  columnHelper.accessor((row) => row.student?.studentId ?? "—", {
    id: "studentId",
    header: "Student ID"
  }),

  // Progress bar + percentage
  columnHelper.accessor("progress", {
    header: "Score Progress",
    cell: ({ getValue, row }) => {
      const progress = getValue()
      const spanClass = "text-xs text-muted-foreground w-9 text-right shrink-0"
      return h("div", { class: "flex items-center gap-2 min-w-32" }, [
        h(
          "span",
          { class: spanClass },
          `${row.original.completedSubjects} / ${row.original.totalSubjects}`
        ),
        h(UiProgress, { modelValue: progress, class: "h-2" }),
        h("span", { class: spanClass }, `${progress}%`)
      ])
    }
  }),

  // Open action
  columnHelper.display({
    id: "action",
    header: "",
    cell: ({ row }) =>
      h(UiButton, {
        variant: "outline",
        size: "sm",
        to: `/dashboard/results/${props.result.id}/${row.original.id}`,
        text: "Open"
      })
  })
]

const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual("md")
const columnVisibility = computed(() => ({
  studentId: isDesktop.value
}))
</script>

<template>
  <div class="space-y-4">
    <div class="w-full flex items-center justify-between">
      <FormKit
        v-model="globalSearch"
        type="search"
        prefix-icon="lucide:search"
        :classes="{ outer: 'mb-0 w-full md:w-1/2' }"
        placeholder="Search for a student"
      />

      <slot name="toolbar" />
    </div>

    <div class="w-full rounded-lg border">
      <UiTanStackTable
        :columns
        :data="scoresheets"
        :loading="loading"
        :global-filter="globalSearch"
        :column-visibility="columnVisibility"
        :manual-pagination="false"
        :manual-filtering="false"
        :manual-sorting="false"
      >
        <template #empty>
          <span v-if="globalSearch">
            No students found for "<strong>{{ globalSearch }}</strong
            >"
          </span>
          <span v-else>No scoresheets found for this result.</span>
        </template>
      </UiTanStackTable>
    </div>
  </div>
</template>
