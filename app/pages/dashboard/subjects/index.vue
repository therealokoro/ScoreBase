<script lang="ts" setup>
import type { UpsertSubjectInput } from "~~/shared/validators/academic"
const openCreateSheet = ref(false)

const { $orpc } = useNuxtApp()
const { data, isPending, refetch } = useListSubjects()
const subjects = computed(() => data.value ?? [])
const createSubject = useCreateSubject()

function handleUpsertSubject(payload: UpsertSubjectInput) {
  useSonner.promise(createSubject.mutateAsync(payload), {
    loading: "Creating a new subject...",
    success: () => {
      openCreateSheet.value = false
      return "New subject was created successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page title="Subjects" description="Create, edit, delete school subjects">
    <UiTabs class="w-full gap-6" default-value="subjects">
      <!-- Tab Triggers -->
      <UiTabsList class="grid w-full sm:w-2/4 grid-cols-2">
        <UiTabsTrigger class="min-w-max text-xs sm:text-sm" value="subjects">
          All Subjects
        </UiTabsTrigger>
        <UiTabsTrigger class="min-w-max text-xs sm:text-sm" value="subject-presets">
          Subject Presets
        </UiTabsTrigger>
      </UiTabsList>

      <!-- All Subjects List -->
      <UiTabsContent value="subjects">
        <h5 class="text-sm text-muted-foreground/80 mb-4">
          Manage all subjects offerable by students
        </h5>

        <!-- Loading -->
        <AppEntitySkeleton v-if="isPending" :count="4" />

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
          <AppEntityAddButton text="Create a subject" @click="openCreateSheet = true" />

          <SubjectCard
            @on-mutation="refetch"
            :key="item.id"
            :name="item.name"
            v-for="item in subjects"
            :subject="item"
          />
        </div>
      </UiTabsContent>

      <!-- Subject Presets -->
      <UiTabsContent value="subject-presets">
        <h5 class="text-sm text-muted-foreground/80 mb-4">
          Manage all subject presets used by classes and students
        </h5>

        <SubjectPresetList />
      </UiTabsContent>
    </UiTabs>

    <!-- Create Logic -->
    <LazySubjectUpsertForm
      mode="Create"
      v-model:open="openCreateSheet"
      @submit="handleUpsertSubject"
    />
  </Page>
</template>
