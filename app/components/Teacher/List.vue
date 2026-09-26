<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"

import AppEntityActionDropdown from "~/components/App/EntityActionDropdown.vue"
import UiBadge from "~/components/Ui/Badge.vue"
import UiButton from "~/components/Ui/Button.vue"
import type { TanStackTableFeatures } from "~/components/Ui/TanStackTable.vue"

const emit = defineEmits(["edit", "delete"])

const { search, debouncedSearch, pagination, onPaginationChange, onFilterChange } = useUrlTableState({
  mode: "server",
  searchKey: "search",
  pageKey: "page",
  sizeKey: "pageSize",
  defaultPageSize: 10,
  debounce: 300
})

const { data, isPending } = useQueryTeachers(
  computed(() => ({
    page: pagination.value.pageIndex,
    pageSize: pagination.value.pageSize,
    search: debouncedSearch.value || undefined
  }))
)

const teachers = computed(() => data.value?.data ?? [])
const pageCount = computed(() => data.value?.pageCount ?? 1)

const columnHelper = createColumnHelper<TanStackTableFeatures, ITeacher>()
const columns = [
  // Serial number — stays correct across pages
  columnHelper.display({
    id: "serial",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.atoms.pagination.get()
      return pageIndex * pageSize + row.index + 1
    }
  }),

  // Clicking a teacher's name navigates to their detail page
  columnHelper.accessor("name", {
    header: "Full Name",
    cell: ({ getValue, row }) =>
      h(UiButton, { variant: "link", onClick: () => emit("edit", row.original) }, () => getValue())
  }),

  columnHelper.accessor("email", { header: "Email Address" }),

  // Class badge — links to the class page
  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) =>
      h(
        UiBadge,
        {
          variant: "outline",
          to: row.original.class ? `/dashboard/classes/${row.original.class.id}` : "#"
        },
        () => row.original.class?.name ?? "Unassigned"
      )
  }),

  columnHelper.accessor("phoneNumber", { header: "Phone Number" }),

  columnHelper.accessor("createdAt", {
    header: "Registered",
    cell: ({ getValue }) => formatDate(getValue())
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return h(AppEntityActionDropdown, {
        onDelete: () => emit("delete", row.original),
        onEdit: () => emit("edit", row.original)
      })
    }
  })
]

const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual("lg")
const columnVisibility = computed(() => ({
  phoneNumber: isDesktop.value,
  email: isDesktop.value,
  createdAt: isDesktop.value
}))
</script>

<template>
  <div class="space-y-4">
    <div class="w-1/2">
      <FormKit
        :model-value="search"
        type="search"
        prefix-icon="lucide:search"
        :classes="{ outer: 'mb-0' }"
        placeholder="Search for a teacher"
        @input="onFilterChange"
      />
    </div>

    <div class="w-full rounded-lg border">
      <UiTanStackTable
        :loading="isPending"
        :columns
        :data="teachers"
        :page-count="pageCount"
        aria-label="Teachers"
        :column-visibility="columnVisibility"
        :pagination="pagination"
        :manual-pagination="true"
        :manual-filtering="true"
        :manual-sorting="false"
        @update:pagination="onPaginationChange"
      >
        <template #empty>
          <span>No teachers yet to display.</span>
        </template>
      </UiTanStackTable>
    </div>
  </div>
</template>
