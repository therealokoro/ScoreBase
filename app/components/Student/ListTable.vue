<script lang="ts" setup>
import { createColumnHelper } from "@tanstack/vue-table"
import { refDebounced, breakpointsTailwind } from "@vueuse/core"
import { ICONS } from "~~/shared/constants/icons"
import { type UpsertStudentInput } from "~~/shared/validators/academic"

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

const props = withDefaults(
  defineProps<{
    classId?: string
    /** Whether to show the "Add Student" button. Default: true */
    showCreateButton?: boolean
  }>(),
  { showCreateButton: true }
)

const route = useRoute()
const router = useRouter()

const globalSearch = ref((route.query.search as string) ?? "")
const pagination = ref({
  pageIndex: Number(route.query.page ?? 0),
  pageSize: Number(route.query.pageSize ?? 10)
})

// Debounced copy of search — avoids firing a request on every keystroke
const debouncedSearch = refDebounced(globalSearch, 1000)

const { $orpc } = useNuxtApp()
const { data, pending, refresh } = useAsyncData(
  // Static but unique key per usage — scoped by classId when on a class page
  `student-list${props.classId ? `-${props.classId}` : ""}`,
  () =>
    $orpc.student.query.call({
      page: pagination.value.pageIndex,
      pageSize: pagination.value.pageSize,
      search: debouncedSearch.value || undefined,
      classId: props.classId || undefined
    }),
  // Re-run whenever pagination changes or debounced search settles
  { watch: [pagination, debouncedSearch] }
)

// Safely derived page count — never undefined or negative
const pageCount = computed(() => data.value?.pageCount ?? 1)

// Sync table state → create a new record in the URL with the current state of the table
watch([pagination, debouncedSearch], ([p, s]) => {
  router.push({
    query: {
      ...route.query,
      page: p.pageIndex > 0 ? String(p.pageIndex) : undefined,
      pageSize: p.pageSize !== 10 ? String(p.pageSize) : undefined,
      search: s || undefined
    }
  })
})

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

// reset page on new search
watch(debouncedSearch, () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
})

// Format dates before passing to the table
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

// When classId is provided, pre-fill it in the create form and lock the field
// so the user can't assign the student to a different class by mistake
const createFormInitialData = computed<any>(() =>
  props.classId ? { classId: props.classId } : undefined
)

const columnHelper = createColumnHelper<Student>()
const isDesktop = useBreakpoints(breakpointsTailwind).greaterOrEqual("lg")

const columnVisibility = computed(() => ({
  // Secondary columns — only visible on large screens
  phoneNumber: isDesktop.value,
  studentId: isDesktop.value,
  // Class column is redundant when already filtered by a specific class
  class: !props.classId
}))

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

  // Clicking a student's name navigates to their detail page
  columnHelper.accessor("name", {
    header: "Full Name",
    cell: ({ getValue, row }) =>
      h(UiButton, { variant: "link", to: `/admin/students/${row.original.id}` }, () => getValue())
  }),

  // Class badge — links to the class page; hidden when classId prop is set
  columnHelper.accessor("class", {
    header: "Class",
    cell: ({ row }) =>
      h(
        UiBadge,
        { variant: "outline", to: `/admin/classes/${row.original.class?.id}` },
        () => row.original.class?.name ?? "Unassigned"
      )
  }),

  // Optional fields — show a badge when empty instead of blank cells
  columnHelper.accessor("studentId", {
    header: "Student ID",
    cell: ({ getValue }) => {
      const val = getValue()
      return val ?? h(UiBadge, { variant: "outline" }, () => "No Value")
    }
  }),
  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: ({ getValue }) => {
      const val = getValue()
      return val ?? h(UiBadge, { variant: "outline" }, () => "No Value")
    }
  }),

  columnHelper.accessor("createdAt", { header: "Registered" })
]
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar: search + optional create button -->
    <div class="flex w-full items-center justify-between">
      <div class="w-1/2">
        <UiInput v-model="globalSearch" placeholder="Search for a student" />
      </div>
      <UiButton v-if="showCreateButton" :icon="ICONS.add" @click="openCreateSheet = true">
        Add Student
      </UiButton>
    </div>

    <!-- Wrapped in ClientOnly to avoid SSR hydration mismatches -->
    <ClientOnly>
      <div class="w-full rounded-lg border">
        <UiTanStackTable
          :columns
          :data="students"
          :loading="pending"
          :page-count="pageCount"
          :manual-filtering="true"
          :manual-pagination="true"
          :column-visibility="columnVisibility"
          @update:pagination="(p) => (pagination = p)"
        />
      </div>

      <template #fallback>
        <div class="w-full space-y-3">
          <UiSkeleton v-for="n in 6" :key="n" class="h-13 w-full" />
        </div>
      </template>
    </ClientOnly>

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
