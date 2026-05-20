<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const sessionId = useRoute().params.sessionId?.toString()
const sessionIdError = !sessionId ? new Error("Academic session was not found") : undefined

const { data, isPending, error } = useGetAcademicSessionDetail(sessionId as string)
const session = computed(() => data.value)
const sessionTerms = computed(() => data.value?.terms || [])

const isSheetOpen = ref(false)
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
      <UiButtonGroup>
        <ui-button
          size="sm"
          text="Edit"
          :icon="ICONS.edit"
          variant="outline"
          @click="isSheetOpen = true"
        />

        <!-- Confirm Delete Session -->
        <AppConfirmDeleteAction
          description="Are you sure you want to delete this session? You will loose all terms and results for this particular session"
          :confirm-input-text="session?.name"
        >
          <ui-button size="sm" :icon="ICONS.delete" variant="destructive" text="Delete" />
        </AppConfirmDeleteAction>
      </UiButtonGroup>
    </template>

    <!-- Manage Sesison Terms -->
    <SessionManageTerms
      :terms="sessionTerms"
      :session-id="sessionId!"
      @select-term="(e) => (activeTerm = e)"
    />

    <!-- Session/Term Result Table -->
    <div class="w-full">
      <div class="w-full min-h-75 rounded-lg border-dashed border-2 flex-center flex-col gap-4">
        <Icon :name="ICONS.result" class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Select a term to view its results</p>
        <pre>{{ activeTerm }}</pre>
      </div>
    </div>

    <!-- Session Edit Form -->
    <LazySessionCreateEditForm
      @submit="handleUpdateSession"
      :initial-data="session"
      v-model:open="isSheetOpen"
      mode="Edit"
    />
  </Page>
</template>

<style lang="css" scoped>
@reference "../../../assets/css/tailwind.css";

.session-term {
  @apply flex items-center justify-between gap-2 hover:bg-muted rounded-lg border px-3 py-2 text-center text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2;
}
</style>
