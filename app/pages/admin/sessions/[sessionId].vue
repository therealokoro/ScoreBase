<script lang="ts" setup>
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

// TODO: get selected term, fetch and dispaly its result in a table
const activeTerm = ref<ITerm | null>(null)
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
    <SessionManageTerms
      :terms="sessionTerms"
      :session-id="sessionId!"
      @select-term="(e) => (activeTerm = e)"
    />

    <!-- Session/Term Result Table -->
    <AppContentPlaceholder text="Select a term to view its results" />

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
      :confirm-input-text="session?.name"
    />
  </Page>
</template>
