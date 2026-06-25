<script setup lang="ts">
const { data, isPending, refetch } = useAcademicSessionList()
const sessions = computed(() => data.value ?? [])

const { data: schoolSettings } = useGetSchoolSettings()
const formData = ref({
  activeSession: schoolSettings.value?.activeSession,
  activeTerm: schoolSettings.value?.activeTerm
})

const sessionOptions = computed(() =>
  sessions.value.map((curr) => ({
    value: curr.id,
    label: curr.name
  }))
)

const termOptions = computed(() => {
  const session = sessions.value.find((c: IAcademicSession) => c.id == formData.value.activeSession)
  if (!session) return []
  return session.terms.map((curr) => ({
    value: curr.id,
    label: curr.name
  }))
})

const createSession = useCreateAcademicSession()
const handleCreateSession = useDebounceFn(() => {
  useSonner.promise(createSession.mutateAsync({}), {
    loading: "Creating academic session...",
    success: () => {
      refetch()
      return "Academic session created successfully"
    },
    error: (err: any) => err.message
  })
}, 1000)

const openDialog = ref(false)
const setSettings = useUpdateSchoolSettings()
async function handleSubmit(payload: any) {
  useSonner.promise(setSettings.mutateAsync(payload), {
    loading: "Setting active session and term...",
    success: () => {
      openDialog.value = false
      return "Active session/term set successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page title="Academic Sessions" description="Manage the schools academic sessions">
    <AppEntitySkeleton v-if="isPending" />

    <!-- Empty -->
    <UiEmpty
      v-else-if="!sessions.length"
      title="No academic sessions"
      description="Create your first academic session to get started"
      button-text="Create Session"
      @button-action="handleCreateSession"
    />

    <!-- Content -->
    <template v-else>
      <div class="w-full mb-4">
        <UiButton @click="openDialog = true" text="Set Active Session/Term" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppEntityCard
          :key="item.id"
          :title="item.name"
          v-for="item in sessions"
          icon="lucide:arrow-right"
          :link="`/dashboard/sessions/${item.id}`"
          :description="formatDate(item.createdAt, 'Created on ')"
        />
        <AppEntityAddButton text="Create a session" @click="handleCreateSession" />
      </div>
    </template>

    <UiDialog v-model:open="openDialog">
      <UiDialogContent
        class="sm:max-w-106.25"
        title="Set Active Session/Term"
        description="Set an active sesison and term used for result creation"
      >
        <template #content>
          <FormKit
            type="form"
            v-model="formData"
            :actions="false"
            id="set-session-and-term"
            @submit="handleSubmit"
          >
            <fieldset :disabled="setSettings.isPending.value">
              <FormKit
                type="_select"
                label="Select a session"
                :options="sessionOptions"
                name="activeSession"
                placeholder="Select a session from the list"
                validation="required"
              />
              <FormKit
                :disabled="!termOptions.length"
                type="_select"
                label="Select a term"
                :options="termOptions"
                name="activeTerm"
                placeholder="Pick a term from the list"
                help="Terms are fetched from selected session"
                validation="required"
              />
            </fieldset>
          </FormKit>
        </template>
        <template #footer>
          <UiDialogFooter>
            <UiButton
              variant="outline"
              class="mt-2 sm:mt-0"
              @click="openDialog = false"
              text="Cancel"
            />
            <UiButton
              type="submit"
              :disabled="setSettings.isPending.value"
              form="set-session-and-term"
              text="Save Setting"
            />
          </UiDialogFooter>
        </template>
      </UiDialogContent>
    </UiDialog>
  </Page>
</template>
