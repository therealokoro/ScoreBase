<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"

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

const { search, pagination, onPaginationChange, onFilterChange } = useUrlTableState({
  mode: "client",
  searchKey: "search",
  pageKey: "page",
  sizeKey: "pageSize",
  defaultPageSize: 10
})

const { data, isPending } = useListResults()

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
    cell: ({ getValue, row }) =>
      h(
        UiButton,
        {
          variant: "link",
          to: `/dashboard/results/${row.original.id}`,
          class: "text-xs md:text-sm"
        },
        () => getValue()
      )
  }),

  columnHelper.accessor("term", { header: "Term" }),

  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => h(ResultStatusBadge, { status: getValue() as any })
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
        :model-value="search"
        type="search"
        prefix-icon="lucide:search"
        :classes="{ outer: 'mb-0' }"
        placeholder="Search for a result"
        @input="onFilterChange"
      />
    </div>

    <div class="w-full rounded-lg border">
      <UiTanStackTable
        :columns
        :data="results"
        :loading="isPending"
        :global-filter="search"
        :column-visibility="columnVisibility"
        :initial-page-size="pagination.pageSize"
        :manual-pagination="false"
        :manual-filtering="false"
        :manual-sorting="false"
        @update:pagination="onPaginationChange"
        @update:global-filter="onFilterChange"
      >
        <template #empty>
          <span v-if="search">
            No results found for "<strong>{{ search }}</strong
            >"
          </span>
          <span v-else>No results yet to display.</span>
        </template>
      </UiTanStackTable>
    </div>
  </div>
</template>
