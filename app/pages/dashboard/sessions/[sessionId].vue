<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
const sessionId = useRoute().params.sessionId?.toString()
const sessionIdError = !sessionId ? new Error("Academic session was not found") : undefined

const { data, isPending, error } = useGetAcademicSessionDetail(sessionId as string)
const session = computed(() => data.value)
const sessionTerms = computed(() => data.value?.terms || [])

setPageBreadcrumbLabel(computed(() => session.value?.name))

const isSheetOpen = ref(false)
const openDeleteDialog = ref(false)

const { mutateAsync: updateSession } = useUpdateAcademicSession()
function handleUpdateSession(payload: any) {
  useSonner.promise(updateSession(payload), {
    loading: "Updating academic session...",
    success: () => {
      isSheetOpen.value = false
      return "Academic session updated successfully"
    },
    error: (err: any) => err.message
  })
}

const { mutateAsync: deleteSession } = useDeleteAcademicSession()
function handleDeleteSession() {
  useSonner.promise(deleteSession({ id: sessionId! }), {
    loading: "Deleting academic session...",
    success: () => {
      navigateTo("/dashboard/sessions")
      return "Academic session deleted successfully"
    },
    error: (err: any) => err.message
  })
}

const activeTerm = ref<ITerm | null>(null)
const {
  data: d,
  isFetching: isFetchingResult,
  refetch: fetchTermResult
} = useGetResultByTerm(() => activeTerm.value?.id ?? null)
const results = computed(() => d.value || [])

async function selectTerm(term: ITerm) {
  if (activeTerm.value?.id == term.id) return

  activeTerm.value = term
  await fetchTermResult()
}
</script>

<template>
  <Page
    :title="session?.name"
    :description="formatDate(session?.updatedAt!, 'Created on ')"
    :loading="isPending"
    :error="sessionIdError ?? error ?? undefined"
  >
    <template #actions>
      <AppEntityActionDropdown @edit="isSheetOpen = true" @delete="openDeleteDialog = true" />
    </template>

    <!-- Manage Sesison Terms -->
    <SessionManageTerms :terms="sessionTerms" :session-id="sessionId!" @select-term="selectTerm" />

    <!-- Session/Term Result Table -->
    <div v-if="activeTerm" class="w-full">
      <h3 class="text-sm font-semibold mb-3">{{ activeTerm.name }} Results</h3>

      <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- loading skeleton -->
        <AppEntitySkeleton v-if="isFetchingResult" :count="2" />

        <!-- show results for selected term -->
        <template v-else-if="!isFetchingResult && results.length">
          <AppEntityCard
            v-for="item in results"
            :title="item.name"
            :link="`/dashboard/results/${item.id}`"
            :description="item.submittedBy ? `Submitted By ${item.submittedBy}` : undefined"
          />
        </template>
        <!-- When term doesn't have a result -->
        <AppContentPlaceholder v-else text="No result for the selected term" :icon="ICONS.result" />
      </div>
    </div>

    <!-- When no term is selected -->
    <AppContentPlaceholder v-else :icon="ICONS.empty" text="Select a term to view its results" />

    <!-- Session Edit Form -->
    <LazySessionCreateEditForm
      @submit="handleUpdateSession"
      :initial-data="session"
      v-model:open="isSheetOpen"
      mode="Edit"
    />

    <AppConfirmDeleteAction
      v-model:open="openDeleteDialog"
      description="Are you sure you want to delete this session? You will loose all terms and results for this particular session"
      @confirm="handleDeleteSession"
      :confirm-input-text="session?.name"
    />
  </Page>
</template>
