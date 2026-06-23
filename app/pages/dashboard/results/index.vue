<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const isSheetOpen = ref(false)

const { data: sessions } = useAcademicSessionList()
const activeSessionId = ref("")
const sessionOptions = computed(() => {
  return (
    sessions.value?.map((curr: IAcademicSession) => ({ label: curr.name, value: curr.id })) || []
  )
})

const activeSessionTermsOptions = computed(() => {
  return (
    sessions.value?.find((curr: IAcademicSession) => curr.id === activeSessionId.value)?.terms || []
  ).map((curr: ITerm) => ({ value: curr.id, label: curr.name }))
})

const { data: classes } = useListClasses()
const classOptions = computed(() => {
  return classes.value?.map((curr: IClass) => ({ label: curr.name, value: curr.id })) || []
})

const createResult = useCreateResult()
async function handleCreateResult(payload: any) {
  // Strip sessionId — it's UI-only for filtering terms, not part of CreateResultSchema
  const { sessionId, ...input } = payload

  useSonner.promise(createResult.mutateAsync(input), {
    loading: "Creating result, please wait...",
    success: () => {
      isSheetOpen.value = false
      return "Result created successfully"
    },
    error: (e: any) => e.message
  })
}
</script>

<template>
  <Page title="Results" description="Manage results across sessions and terms">
    <div class="w-full flex gap-3">
      <ui-button @click="isSheetOpen = true" :icon="ICONS.add">Create New Result</ui-button>
      <ui-button to="/dashboard/results/settings" variant="outline" :icon="ICONS.settings">
        Result Settings
      </ui-button>
    </div>

    <!-- <AppContentPlaceholder
      title="View Result"
      text='Use the "Load a Result" button above to open a result'
    /> -->
    <ResultListTable />

    <UiSheet v-model:open="isSheetOpen">
      <UiSheetContent
        side="right"
        title="Create a Result"
        class="w-full sm:max-w-none md:w-100"
        description="Create a new result for a term and class"
      >
        <template #content>
          <FormKit
            id="create-result-form"
            type="form"
            :actions="false"
            @submit="handleCreateResult"
          >
            <fieldset :disabled="createResult.isPending.value" class="p-4 pt-0">
              <FormKitMessages class="mb-4" />

              <FormKit
                type="_select"
                name="sessionId"
                label="Session"
                :options="sessionOptions"
                v-model="activeSessionId"
                placeholder="Select a session"
                help="Automatically selects the active session"
                validation="required"
              />

              <FormKit
                type="_select"
                name="termId"
                label="Term"
                :disabled="!activeSessionTermsOptions.length"
                :options="activeSessionTermsOptions"
                placeholder="Select a term for the result"
                help="Options are fetched once a session is selected"
                validation="required"
              />

              <FormKit
                type="_select"
                name="classId"
                label="Class"
                :options="classOptions"
                placeholder="Select a class for the result"
                help="Pick a class for this result"
                validation="required"
              />
            </fieldset>
          </FormKit>
        </template>

        <template #footer>
          <UiSheetFooter>
            <div class="w-full flex gap-1">
              <UiSheetClose as-child>
                <UiButton
                  class="flex-1"
                  variant="outline"
                  type="button"
                  :disabled="createResult.isPending.value"
                >
                  Cancel
                </UiButton>
              </UiSheetClose>

              <UiButton
                class="flex-1"
                type="submit"
                form="create-result-form"
                :disabled="createResult.isPending.value"
                :loading="createResult.isPending.value"
              >
                {{ createResult.isPending.value ? "Submitting..." : "Submit" }}
              </UiButton>
            </div>
          </UiSheetFooter>
        </template>
      </UiSheetContent>
    </UiSheet>
  </Page>
</template>
