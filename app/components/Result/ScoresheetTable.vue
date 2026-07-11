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

const route = useRoute()
const router = useRouter()

// ── URL-persisted state ───────────────────────────────────────────────────
// pageIndex is 0-based internally (TanStack Table convention) but stored as
// 1-based in the URL to match user expectations (?page=1, not ?page=0).
const globalSearch = computed({
  get: () => (route.query.q as string) || "",
  set: (val) =>
    router.replace({
      query: { ...route.query, q: val || undefined, page: undefined }
    })
})

const pageIndex = computed({
  get: () => Math.max(0, (Number(route.query.page) || 1) - 1),
  set: (val) =>
    router.replace({
      query: { ...route.query, page: val > 0 ? String(val + 1) : undefined }
    })
})

const pageSize = computed({
  get: () => Number(route.query.size) || 10,
  set: (val) =>
    router.replace({
      query: { ...route.query, size: val !== 10 ? String(val) : undefined, page: undefined }
    })
})

function onPaginationChange(p: { pageIndex: number; pageSize: number }) {
  // Only push to URL if values actually changed to avoid redundant history entries
  if (p.pageIndex !== pageIndex.value) pageIndex.value = p.pageIndex
  if (p.pageSize !== pageSize.value) pageSize.value = p.pageSize
}

function onFilterChange(val: any) {
  globalSearch.value = val
}

// ── Scoresheet computation ────────────────────────────────────────────────
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

// ── Columns ───────────────────────────────────────────────────────────────
const columnHelper = createColumnHelper<ScoresheetRow>()
const columns = [
  columnHelper.display({
    id: "serial",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex: pi, pageSize: ps } = table.getState().pagination
      return pi * ps + row.index + 1
    }
  }),

  columnHelper.accessor((row) => row.student?.name ?? "Unknown student", {
    id: "studentName",
    header: "Student",
    cell: ({ row }) =>
      h(
        UiButton,
        {
          variant: "link",
          to: `/dashboard/results/${props.result.id}/${row.original.id}`,
          class: "text-xs md:text-sm font-medium"
        },
        () => row.original.student?.name ?? "Unknown student"
      )
  }),

  columnHelper.accessor((row) => row.student?.studentId ?? "—", {
    id: "studentId",
    header: "Student ID"
  }),

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
const columnVisibility = computed(() => ({ studentId: isDesktop.value }))
</script>

<template>
  <div class="space-y-4">
    <div class="w-full flex items-center justify-between">
      <FormKit
        :model-value="globalSearch"
        type="search"
        prefix-icon="lucide:search"
        :classes="{ outer: 'mb-0 w-full md:w-1/2' }"
        placeholder="Search for a student"
        @input="onFilterChange"
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
        :initial-page-size="pageSize"
        :manual-pagination="false"
        :manual-filtering="false"
        :manual-sorting="false"
        @update:pagination="onPaginationChange"
        @update:global-filter="onFilterChange"
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
