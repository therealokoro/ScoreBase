<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { refDebounced, breakpointsTailwind, useDebounceFn } from "@vueuse/core"

import ResultStatusBadge from "~/components/Result/StatusBadge.vue"
import UiBadge from "~/components/Ui/Badge.vue"
import UiButton from "~/components/Ui/Button.vue"

type Result = {
  id: string
  name: string
  session: string
  term: string
  status: string
  class: { id: string; name: string }
  createdAt: string
}

const props = defineProps<{ classId?: string }>()

const route = useRoute()
const router = useRouter()

// Initial state read from the URL on load — same as before
const globalSearch = ref((route.query.search as string) ?? "")
const pagination = ref({
  pageIndex: Number(route.query.page ?? 0),
  pageSize: Number(route.query.pageSize ?? 10)
})

// Debounced copy of search — avoids pushing a new URL entry on every keystroke.
// Note: this only debounces the URL write, not the actual filtering — the
// table filters instantly off globalSearch since everything is client-side.
const debouncedSearch = refDebounced(globalSearch, 300)

const { data, isPending } = useListResults()

// Debounced push — collapses rapid pagination clicks into a single history entry
const pushQuery = useDebounceFn((p: typeof pagination.value, s: string) => {
  router.push({
    query: {
      ...route.query,
      page: p.pageIndex > 0 ? String(p.pageIndex) : undefined,
      pageSize: p.pageSize !== 10 ? String(p.pageSize) : undefined,
      search: s || undefined
    }
  })
}, 300)

// Sync table state → URL (no refetch involved — purely cosmetic/shareable state)
watch([pagination, debouncedSearch], ([p, s]) => pushQuery(p, s))

// Sync URL → table state (handles browser back/forward)
watch(
  () => route.query,
  (query) => {
    pagination.value = {
      pageIndex: Number(query.page ?? 0),
      pageSize: Number(query.pageSize ?? 10)
    }
    globalSearch.value = (query.search as string) ?? ""
  }
)

// Reset to first page when search term changes so results start from the top
watch(globalSearch, () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
})

// Format dates before passing to the table
const results = computed(() => {
  return (
    data.value?.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      session: c.term.session.name,
      term: c.term.name,
      class: c.class,
      createdAt: formatDate(c.createdAt)
    })) ?? []
  )
})

const columnHelper = createColumnHelper<Result>()
const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual("lg")

const columnVisibility = computed(() => ({
  term: isDesktop.value,
  session: isDesktop.value,
  createdAt: isDesktop.value,
  class: !props.classId
}))

const columns = [
  columnHelper.display({
    id: "serial",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      return pageIndex * pageSize + row.index + 1
    }
  }),

  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ getValue, row }) => {
      return h(
        UiButton,
        {
          variant: "link",
          to: `/dashboard/results/${row.original.id}`,
          class: "text-xs md:text-sm"
        },
        () => getValue()
      )
    }
  }),

  columnHelper.accessor("term", { header: "Term" }),

  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      return h(ResultStatusBadge, { status: getValue() as any })
    }
  }),

  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) =>
      h(
        UiBadge,
        { variant: "outline", to: `/dashboard/classes/${row.original.class.id}` },
        () => row.original.class.name
      )
  }),

  columnHelper.accessor("createdAt", { header: "Created" })
]
</script>

<template>
  <div class="space-y-4">
    <div class="w-1/2">
      <FormKit
        v-model="globalSearch"
        type="search"
        prefix-icon="lucide:search"
        :classes="{ outer: 'mb-0' }"
        placeholder="Search for a result"
      />
    </div>

    <div class="w-full rounded-lg border">
      <UiTanStackTable
        :columns
        :data="results"
        :loading="isPending"
        v-model:global-filter="globalSearch"
        :column-visibility="columnVisibility"
        :initial-page-size="pagination.pageSize"
        :manual-pagination="false"
        :manual-filtering="false"
        :manual-sorting="false"
        @update:pagination="(p) => (pagination = p)"
      >
        <template #empty>
          <span v-if="globalSearch">
            No results found for "<strong>{{ globalSearch }}</strong
            >"
          </span>
          <span v-else>No results yet to display.</span>
        </template>
      </UiTanStackTable>
    </div>
  </div>
</template>
