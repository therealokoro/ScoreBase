<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

import type { StatsCardProps } from "~/components/App/StatsCard.vue"

const classId = useRoute().params.classId?.toString()
const classIdError = !classId ? new Error("Class was not found") : undefined

const { data, isPending, error, refetch } = useGetSingleClass(classId || "")

const currClass = computed(() => data.value)
const classTeacher = computed(() => data.value?.teacher || null)

// Dynamically set the breadcrumb label once data is loaded
setPageBreadcrumbLabel(computed(() => currClass.value?.name))

// Placeholder class stats info
const classStats = computed<StatsCardProps[]>(() => {
  return [
    {
      label: "Total Students",
      value: currClass.value?.count.students || "0",
      icon: ICONS.students as string
    }
  ]
})

const isSheetOpen = ref(false)
const openDeleteDialog = ref(false)
const updateClass = useUpdateClass()

function handleUpdateClass(payload: any) {
  useSonner.promise(updateClass.mutateAsync(payload), {
    loading: "Updating class info...",
    success: () => {
      isSheetOpen.value = false
      return "Class was updated successfully"
    },
    error: (err: any) => err.message
  })
}

const deleteClass = useDeleteClass()
function handleDeleteAction() {
  useSonner.promise(deleteClass.mutateAsync({ id: classId! }), {
    loading: "Deleting class info...",
    success: () => {
      navigateTo("/dashboard/classes")
      return "Class was deleted successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page
    :title="currClass?.name"
    :badge="classTeacher ? `Teacher: ${classTeacher.name}` : undefined"
    :error="classIdError ?? error ?? undefined"
  >
    <template #actions>
      <AppEntityActionDropdown @edit="isSheetOpen = true" @delete="openDeleteDialog = true" />
    </template>

    <!-- When loading -->
    <AppEntitySkeleton v-if="isPending" :count="4" />

    <!-- Class Stats -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" v-else>
      <!-- Show class subject list preset -->
      <ClassSubjectPresetControl
        v-if="currClass"
        :active-class="currClass"
        @onMutation="() => refetch()"
      />

      <!-- Show class stats -->
      <AppStatsCard v-for="item in classStats" v-bind="item" />
    </div>

    <StudentListTable :class-id="classId" :show-create-button="true" />

    <!-- currClass Edit Form -->
    <LazyClassUpsertForm
      v-if="currClass && isSheetOpen"
      :key="isSheetOpen.toString()"
      mode="Edit"
      @submit="handleUpdateClass"
      :initial-data="currClass"
      v-model:open="isSheetOpen"
    />

    <!-- Confirm Delete currClass -->
    <AppConfirmDeleteAction
      v-model:open="openDeleteDialog"
      description="Are you sure you want to delete this class? You will loose all results for this class"
      :confirm-input-text="currClass?.name"
      @confirm="handleDeleteAction"
    />
  </Page>
</template>
