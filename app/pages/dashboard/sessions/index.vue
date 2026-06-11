<script setup lang="ts">
const { data, isLoading, refetch } = useAcademicSessionList()
const sessions = computed(() => data.value ?? [])

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
        @button-action="handleCreateSession"
      />

      <!-- Content -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <!-- Fallback shown on server and before client hydrates -->
      <template #fallback>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UiSkeleton v-for="i in 4" :key="i" class="h-20" />
        </div>
      </template>
    </ClientOnly>
  </Page>
</template>
