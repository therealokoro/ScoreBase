<script setup lang="ts">
import type { UpsertAcademicSessionInput } from "~~/shared/validators/academic"

import { ICONS } from "#shared/constants/icons"

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
      <!-- Loading -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UiSkeleton v-for="i in 4" :key="i" class="h-20" />
      </div>

      <!-- Empty -->
      <UiEmpty
        v-else-if="!sessions.length"
        title="No academic sessions"
        description="Create your first academic session to get started"
      >
        <template #content>
          <UiButton :icon="ICONS.add" variant="outline" @click="openCreateSheet = true">
            Create Session
          </UiButton>
        </template>
      </UiEmpty>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UiCard
          v-for="item in sessions"
          :key="item.id"
          :to="`/#admin/${item.id}`"
          class="relative justify-center gap-2 px-4"
        >
          <UiCardTitle>{{ item.name }}</UiCardTitle>
          <UiCardDescription>{{ formatDate(item.createdAt, "Created on ") }}</UiCardDescription>
          <div class="absolute flex items-center inset-y-0 right-4 z-2">
            <Icon name="lucide:arrow-right" variant="ghost" />
          </div>
        </UiCard>

        <UiCard class="border-dashed bg-muted" clickable @click="openCreateSheet = true">
          <div class="flex items-center justify-center h-full gap-2">
            <Icon :name="ICONS.add" />
            <p class="text-sm">Create a session</p>
          </div>
        </UiCard>
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
