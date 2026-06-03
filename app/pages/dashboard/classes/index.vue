<script lang="ts" setup>
import type { UpsertClassInput } from "~~/shared/validators/academic"
const openCreateSheet = ref(false)

const { $orpc } = useNuxtApp()
const { data, pending, refresh } = await useAsyncData("classes", () => $orpc.class.list.call())
const classes = computed(() => data.value ?? [])

const createClass = useCreateClass()
function handleCreateClass(payload: UpsertClassInput) {
  useSonner.promise(createClass.mutateAsync(payload), {
    loading: "Creating a new class...",
    success: () => {
      refresh()
      openCreateSheet.value = false
      return "New class created successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page title="Classes" description="Create, edit, delete school classes">
    <!-- Loading -->
    <AppEntitySkeleton v-if="pending" :count="4" />

    <!-- Empty -->
    <UiEmpty
      v-else-if="!classes.length"
      title="No classes to display"
      description="Create a new class to get started"
      button-text="Create a class"
      @button-action="openCreateSheet = true"
    />

    <!-- Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AppEntityAddButton text="Create a class" @click="openCreateSheet = true" />

      <AppEntityCard
        :key="item.id"
        :title="item.name"
        v-for="item in classes"
        icon="lucide:arrow-right"
        :link="`/dashboard/classes/${item.id}`"
        :description="formatDate(item.createdAt, 'Created on ')"
      />
    </div>

    <LazyClassUpsertForm v-model:open="openCreateSheet" mode="Create" @submit="handleCreateClass" />
  </Page>
</template>
