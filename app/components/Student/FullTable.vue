<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"

import UiBadge from "~/components/Ui/Badge.vue"
import UiButton from "~/components/Ui/Button.vue"

type Student = {
  id: string
  name: string
  class: { id: string; name: string }
  phoneNumber?: string | null
  studentId?: string | null
  createdAt: string
}

defineProps<{ data: Student[] }>()

const columnHelper = createColumnHelper<Student>()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isDesktop = breakpoints.greaterOrEqual("lg")

// show phone number and student Id only on desktop
const columnVisibility = computed(() => ({
  phoneNumber: isDesktop.value,
  studentId: isDesktop.value,
  createdAt: isDesktop.value
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
    header: "Full Name",
    cell: ({ getValue, row }) => {
      return h(
        UiButton,
        {
          variant: "link",
          title: "Click to view",
          to: `/admin/students/${row.original.id}`
        },
        () => getValue()
      )
    }
  }),
  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) => {
      return h(
        UiButton,
        {
          variant: "link",
          title: "Click to view",
          to: `/admin/classes/${row.original.class.id}`
        },
        () => row.original.class.name
      )
    }
  }),
  columnHelper.accessor("studentId", {
    header: "Student ID",
    cell: ({ getValue }) => {
      const val = getValue()
      return val ? val : h(UiBadge, { variant: "outline" }, () => "No Value")
    }
  }),
  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: ({ getValue }) => {
      const val = getValue()
      return val ? val : h(UiBadge, { variant: "outline" }, () => "No Value")
    }
  }),
  columnHelper.accessor("createdAt", { header: "Registered" })
]
</script>

<template>
  <div class="w-full rounded-lg border">
    <UiTanStackTable :columns :data :columnVisibility />
  </div>
</template>
