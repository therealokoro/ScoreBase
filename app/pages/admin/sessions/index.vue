<script setup lang="ts">
import type { UpsertAcademicSessionInput } from "~~/shared/validators/academic"

const { data, isLoading } = useAcademicSessionList()
const sessions = computed(() => data.value ?? [])
const { mutateAsync: createSession } = useCreateAcademicSession()

const openCreateSheet = ref(false)

function handleCreateSession(payload: UpsertAcademicSessionInput) {
  useSonner.promise(createSession(payload), {
    loading: "Creating academic session...",
    success: () => {
      openCreateSheet.value = false
      return "Academic session created successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page title="Academic Sessions" description="Manage the schools academic sessions">
    <ClientOnly>
      <AppEntitySkeleton v-if="isLoading" />

      <!-- Empty -->
      <UiEmpty
        v-else-if="!sessions.length"
        title="No academic sessions"
        description="Create your first academic session to get started"
        button-text="Create Session"
        @button-action="openCreateSheet = true"
      />

      <!-- Content -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppEntityCard
          :key="item.id"
          :title="item.name"
          v-for="item in sessions"
          icon="lucide:arrow-right"
          :link="`/admin/sessions/${item.id}`"
          :description="formatDate(item.createdAt, 'Created on ')"
        />

        <AppEntityAddButton text="Create a session" @click="openCreateSheet = true" />
      </div>

      <!-- Fallback shown on server and before client hydrates -->
      <template #fallback>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UiSkeleton v-for="i in 4" :key="i" class="h-20" />
        </div>
      </template>
    </ClientOnly>

    <LazySessionCreateEditForm
      mode="Create"
      v-model:open="openCreateSheet"
      @submit="handleCreateSession"
    />
  </Page>
</template>
