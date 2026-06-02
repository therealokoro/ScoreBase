<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"

import AppEntityActionDropdown from "~/components/App/EntityActionDropdown.vue"
import UiBadge from "~/components/Ui/Badge.vue"
import UiButton from "~/components/Ui/Button.vue"

const props = defineProps<{ teachers: ITeacher[] }>()
const emit = defineEmits(["edit", "delete"])

const columnHelper = createColumnHelper<ITeacher>()
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

  // Clicking a teacher's name navigates to their detail page
  columnHelper.accessor("name", {
    header: "Full Name",
    cell: ({ getValue, row }) =>
      h(UiButton, { variant: "link", onClick: () => emit("edit", row) }, () => getValue())
  }),

  columnHelper.accessor("email", { header: "Email Address" }),

  // Class badge — links to the class page
  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) =>
      h(
        UiBadge,
        { variant: "outline", to: `/admin/classes/${row.original.class?.id}` },
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
  <ClientOnly>
    <div class="w-full rounded-lg border">
      <UiTanStackTable :columns :data="teachers" :column-visibility="columnVisibility">
        <template #empty>
          <span>No teachers yet to display.</span>
        </template>
      </UiTanStackTable>
    </div>
  </ClientOnly>
</template>
