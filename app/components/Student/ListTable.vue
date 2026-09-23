<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { breakpointsTailwind } from "@vueuse/core"
import { ICONS } from "~~/shared/constants/icons"
import { type UpsertStudentInput } from "~~/shared/validators/academic"

import UiBadge from "~/components/Ui/Badge.vue"
import UiButton from "~/components/Ui/Button.vue"
import type { TanStackTableFeatures } from "~/components/Ui/TanStackTable.vue"

type Student = {
  id: string
  name: string
  class: { id: string; name: string }
  phoneNumber?: string | null
  studentId?: string | null
  createdAt: string
}

const props = withDefaults(defineProps<{ classId?: string; showCreateButton?: boolean }>(), {
  showCreateButton: true
})

const { search, debouncedSearch, pagination, onPaginationChange } = useUrlTableState({
  mode: "server",
  searchKey: "search",
  pageKey: "page",
  sizeKey: "pageSize",
  defaultPageSize: 10,
  debounce: 1000
})

const { $orpc } = useNuxtApp()
const { data, pending, refresh } = useLazyAsyncData(
  `student-list${props.classId ? `-${props.classId}` : ""}`,
  () =>
    $orpc.student.query.call({
      page: pagination.value.pageIndex,
      pageSize: pagination.value.pageSize,
      search: debouncedSearch.value || undefined,
      classId: props.classId || undefined
    }),
  { watch: [pagination, debouncedSearch] }
)

const pageCount = computed(() => data.value?.pageCount ?? 1)

// Clamp pageIndex if the current page exceeds total after a search narrows results
watch(pageCount, (count) => {
  if (pagination.value.pageIndex >= count) {
    onPaginationChange({ ...pagination.value, pageIndex: 0 })
  }
})

const students = computed(
  () =>
    data.value?.data.map((s) => ({
      ...s,
      createdAt: formatDate(s.createdAt)
    })) ?? []
)

const openCreateSheet = ref(false)
const createStudent = useCreateStudent()

async function handleCreateStudent(payload: UpsertStudentInput) {
  useSonner.promise(createStudent.mutateAsync(payload), {
    loading: "Creating student, please wait...",
    success: (d: any) => {
      refresh()
      openCreateSheet.value = false
      return `${d.name} was created successfully`
    },
    error: (err: any) => err.message
  })
}

const createFormInitialData = computed<any>(() =>
  props.classId ? { classId: props.classId } : undefined
)

const columnHelper = createColumnHelper<TanStackTableFeatures, Student>()
const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual("lg")

const columnVisibility = computed(() => ({
  phoneNumber: isDesktop.value,
  studentId: isDesktop.value,
  class: !props.classId
}))

const columns = [
  columnHelper.display({
    id: "serial",
    header: "#",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.atoms.pagination.get()
      return pageIndex * pageSize + row.index + 1
    }
  }),

  columnHelper.accessor("name", {
    header: "Full Name",
    cell: ({ getValue, row }) =>
      h(UiButton, { variant: "link", to: `/dashboard/students/${row.original.id}` }, () =>
        getValue()
      )
  }),

  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) =>
      h(
        UiBadge,
        { variant: "outline", to: `/dashboard/classes/${row.original.class?.id}` },
        () => row.original.class?.name ?? "Unassigned"
      )
  }),

  columnHelper.accessor("studentId", {
    header: "Student ID",
    cell: ({ getValue }) => getValue() ?? h(UiBadge, { variant: "outline" }, () => "No Value")
  }),

  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: ({ getValue }) => getValue() ?? h(UiBadge, { variant: "outline" }, () => "No Number")
  }),

  columnHelper.accessor("createdAt", { header: "Registered" })
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex w-full items-center justify-between">
      <div class="w-1/2">
        <FormKit
          v-model="search"
          type="search"
          prefix-icon="lucide:search"
          :classes="{ outer: 'mb-0' }"
          placeholder="Search for a student"
        />
      </div>
      <UiButton
        v-if="showCreateButton"
        :size="isDesktop ? 'md' : 'sm'"
        :icon="ICONS.add"
        @click="openCreateSheet = true"
      >
        Add Student
      </UiButton>
    </div>

    <div class="w-full rounded-lg border">
      <UiTanStackTable
        :columns
        :data="students"
        :loading="pending"
        :page-count="pageCount"
        :manual-filtering="true"
        :manual-pagination="true"
        :column-visibility="columnVisibility"
        :initial-page-size="pagination.pageSize"
        @update:pagination="onPaginationChange"
      >
        <template #empty>
          <span v-if="search">
            No students found for "<strong>{{ search }}</strong
            >"
          </span>
          <span v-else>No students yet to display.</span>
        </template>
      </UiTanStackTable>
    </div>

    <LazyStudentUpsertForm
      v-if="showCreateButton && openCreateSheet"
      mode="Create"
      :key="createFormInitialData?.classId"
      :initial-data="createFormInitialData"
      v-model:open="openCreateSheet"
      @submit="handleCreateStudent"
      @close="openCreateSheet = false"
    />
  </div>
</template>
