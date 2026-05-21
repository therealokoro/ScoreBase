<script lang="ts" setup>
import type { UpsertSubjectInput } from "~~/shared/validators/academic"
const openCreateSheet = ref(false)

const { $orpc } = useNuxtApp()
const { data, pending, refresh } = await useAsyncData("subjects", () => $orpc.subject.list.call())
const subjects = computed(() => data.value ?? [])
const createSubject = useCreateSubject()

function handleUpsertSubject(payload: UpsertSubjectInput) {
  useSonner.promise(createSubject.mutateAsync(payload), {
    loading: "Creating a new subject...",
    success: () => {
      refresh()
      openCreateSheet.value = false
      return "New subject was created successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page title="Subjects" description="Create, edit, delete school subjects">
    <!-- Loading -->
    <AppEntitySkeleton v-if="pending" :count="4" />

    <!-- Empty -->
    <UiEmpty
      v-else-if="!subjects.length"
      title="No subjects to display"
      description="Create a new subject to get started"
      button-text="Create a subject"
      @button-action="openCreateSheet = true"
    />

    <!-- Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      <SubjectCard
        @on-mutation="refresh"
        :key="item.id"
        :name="item.name"
        v-for="item in subjects"
        :subject="item"
      />

      <AppEntityAddButton text="Create a subject" @click="openCreateSheet = true" />
    </div>

    <!-- Create Logic -->
    <SubjectUpsertForm mode="Create" v-model:open="openCreateSheet" @submit="handleUpsertSubject" />
  </Page>
</template>
