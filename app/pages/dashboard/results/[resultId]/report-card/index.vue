<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const route = useRoute()
const router = useRouter()
const resultId = route.params.resultId as string

const { data, isPending, error } = useGetResult(resultId)
const result = computed(() => data.value)

setPageBreadcrumbLabels({
  [route.params.resultId as string]: computed(() => result.value?.name)
})

const PER_PAGE = 10

// Derive search and page directly from the URL query so browser back/forward
// navigation restores the exact list state the user was on.
// Changing search clears page (reset to 1) by dropping the param entirely.
const search = computed({
  get: () => (route.query.q as string) || "",
  set: (val) =>
    router.replace({
      query: { ...route.query, q: val || undefined, page: undefined }
    })
})

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: (val) =>
    router.replace({
      query: { ...route.query, page: val > 1 ? String(val) : undefined }
    })
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return result.value?.scoresheets ?? []
  return (result.value?.scoresheets ?? []).filter(
    (s) => s.student.name.toLowerCase().includes(q) || s.student.studentId.toLowerCase().includes(q)
  )
})

const total = computed(() => filtered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)))

const paginated = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return filtered.value.slice(start, start + PER_PAGE)
})
</script>

<template>
  <Page
    :title="`Report Cards | ${result?.name ?? ''}`"
    description="Select a student to view and print their report card"
    :loading="isPending"
    :error="error"
  >
    <div v-if="result" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <!-- Search -->
        <FormKit
          :model-value="search"
          type="text"
          placeholder="Search by name or student ID..."
          outer-class="!mb-0 w-full sm:max-w-xs"
          prefix-icon="heroicons:magnifying-glass"
          @input="(e: string) => (search = e)"
        />

        <UiButton
          variant="outline"
          :icon="ICONS.previous"
          :to="`/dashboard/results/${resultId}`"
          class="shrink-0"
        >
          Back to Result
        </UiButton>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NuxtLink
          v-for="sheet in paginated"
          :key="sheet.id"
          :to="`/dashboard/results/${resultId}/report-card/${sheet.id}`"
          class="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Icon :name="ICONS.students" class="size-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ sheet.student.name }}</p>
              <p class="text-xs text-muted-foreground">{{ sheet.student.studentId }}</p>
            </div>
          </div>
          <Icon :name="ICONS.forward" class="size-4 shrink-0 text-muted-foreground" />
        </NuxtLink>

        <UiEmpty
          v-if="!paginated.length"
          class="col-span-2"
          title="No students found"
          :description="
            search ? `No results matching '${search}'` : 'No scoresheets on this result yet'
          "
        />
      </div>

      <!-- Pagination — only shown when there's more than one page -->
      <UiPagination
        v-if="totalPages > 1"
        :page="page"
        :total="total"
        :items-per-page="PER_PAGE"
        :sibling-count="1"
        class="mx-auto w-full max-w-sm"
        @update:page="page = $event"
      >
        <UiPaginationList class="w-full justify-between">
          <UiPaginationPrev as-child>
            <UiButton variant="outline" size="icon-sm">
              <span class="sr-only">Previous</span>
              <Icon name="lucide:chevron-left" class="size-4" />
            </UiButton>
          </UiPaginationPrev>

          <p class="text-sm text-muted-foreground">
            Page <span class="text-foreground font-medium">{{ page }}</span> of
            <span class="text-foreground font-medium">{{ totalPages }}</span>
          </p>

          <UiPaginationNext as-child>
            <UiButton variant="outline" size="icon-sm">
              <span class="sr-only">Next</span>
              <Icon name="lucide:chevron-right" class="size-4" />
            </UiButton>
          </UiPaginationNext>
        </UiPaginationList>
      </UiPagination>
    </div>
  </Page>
</template>
