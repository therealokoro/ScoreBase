<script lang="ts" setup>
import type { ResultWithDetail } from "~~/shared/validators/scoresheet"

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

type SortMode = "alpha" | "completed" | "rank"
type Scoresheet = ResultWithDetail["scoresheets"][number]

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

const sort = computed({
  get: () => ((route.query.sort as string) || "alpha") as SortMode,
  set: (val) =>
    router.replace({
      query: { ...route.query, sort: val !== "alpha" ? val : undefined, page: undefined }
    })
})

// ── Per-scoresheet computation ─────────────────────────────────────────────
// Mirrors the logic in shared/utils/report-card.ts but inlined here so this
// page has no server-module dependency. We only need total and completion
// flag — not grades, position labels, or the full computed shape.
function getStudentTotal(sheet: Scoresheet): number | null {
  let total = 0
  for (const score of sheet.subjectScores) {
    const caComplete = score.caScores.every((s) => s !== null)
    if (!caComplete || score.exam === null) return null
    total += score.caScores.reduce<number>((sum, s) => sum + (s ?? 0), 0) + score.exam
  }
  return total
}

function isComplete(sheet: Scoresheet): boolean {
  if (!sheet.subjectScores.length) return false
  return sheet.subjectScores.every((s) => s.caScores.every((c) => c !== null) && s.exam !== null)
}

// Rank map: studentId → 1-based dense rank (equal totals share same rank).
// Incomplete students are unranked (undefined in map).
const rankMap = computed(() => {
  const sheets = result.value?.scoresheets ?? []
  const totals = sheets
    .map((s) => ({ id: s.student.id, total: getStudentTotal(s) }))
    .filter((s): s is { id: string; total: number } => s.total !== null)

  const unique = [...new Set(totals.map((t) => t.total))].sort((a, b) => b - a)
  const map = new Map<string, number>()
  for (const { id, total } of totals) {
    map.set(id, unique.indexOf(total) + 1)
  }
  return map
})

// ── Filter → sort → paginate ───────────────────────────────────────────────
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const all = result.value?.scoresheets ?? []
  return q
    ? all.filter(
        (s) =>
          s.student.name.toLowerCase().includes(q) || s.student.studentId.toLowerCase().includes(q)
      )
    : all
})

const sorted = computed(() => {
  const list = [...filtered.value]
  if (sort.value === "alpha") {
    return list.sort((a, b) => a.student.name.localeCompare(b.student.name))
  }
  if (sort.value === "completed") {
    return list.sort((a, b) => {
      const ac = isComplete(a) ? 0 : 1
      const bc = isComplete(b) ? 0 : 1
      if (ac !== bc) return ac - bc
      // Secondary sort alphabetically within each group
      return a.student.name.localeCompare(b.student.name)
    })
  }
  // rank: complete students first by rank ascending, incomplete last alphabetically
  return list.sort((a, b) => {
    const ar = rankMap.value.get(a.student.id)
    const br = rankMap.value.get(b.student.id)
    if (ar !== undefined && br !== undefined) return ar - br
    if (ar !== undefined) return -1
    if (br !== undefined) return 1
    return a.student.name.localeCompare(b.student.name)
  })
})

const total = computed(() => sorted.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PER_PAGE)))

const paginated = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return sorted.value.slice(start, start + PER_PAGE)
})

const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
  { value: "alpha", label: "A – Z", icon: "lucide:arrow-down-a-z" },
  { value: "completed", label: "Completed first", icon: "lucide:check-circle" },
  { value: "rank", label: "By rank", icon: "lucide:trophy" }
]
</script>

<template>
  <Page
    :title="`Report Cards | ${result?.name ?? ''}`"
    description="Select a student to view and print their report card"
    :loading="isPending"
    :error="error"
  >
    <div v-if="result" class="space-y-4">
      <!-- Toolbar -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <!-- Search -->
          <FormKit
            :model-value="search"
            type="text"
            placeholder="Search by name or student ID..."
            outer-class="!mb-0 flex-1 md:w-lg"
            input-class="text-xs sm:text-sm h-8"
            :prefix-icon="ICONS.search"
            @input="(e) => (search = e as string)"
          />

          <!-- Sort dropdown -->
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton variant="outline" class="gap-2">
                <Icon :name="SORT_OPTIONS.find((o) => o.value === sort)!.icon" class="size-3" />
                {{ SORT_OPTIONS.find((o) => o.value === sort)!.label }}
                <Icon name="lucide:chevrons-up-down" class="size-3 text-muted-foreground" />
              </UiButton>
            </UiDropdownMenuTrigger>

            <UiDropdownMenuContent align="start" class="w-44">
              <UiDropdownMenuLabel>Sort by</UiDropdownMenuLabel>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem
                v-for="opt in SORT_OPTIONS"
                :key="opt.value"
                class="gap-2"
                @click="sort = opt.value"
              >
                <Icon :name="opt.icon" class="size-3 shrink-0" />
                <span class="text-xs">{{ opt.label }}</span>
                <Icon
                  v-if="sort === opt.value"
                  name="lucide:check"
                  class="size-3 ml-auto text-primary"
                />
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>

        <UiButton
          variant="ghost"
          :icon="ICONS.previous"
          :to="`/dashboard/results/${resultId}`"
          class="shrink-0 sm:ml-auto"
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

          <div class="flex items-center gap-2 shrink-0">
            <!-- Completion badge -->
            <span
              v-if="isComplete(sheet)"
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              Complete
            </span>
            <!-- Rank badge when in rank mode and ranked -->
            <span
              v-if="sort === 'rank' && rankMap.get(sheet.student.id)"
              class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              #{{ rankMap.get(sheet.student.id) }}
            </span>
            <Icon :name="ICONS.forward" class="size-4 text-muted-foreground" />
          </div>
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

      <!-- Pagination -->
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
