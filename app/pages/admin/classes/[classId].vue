<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

import type { StatsCardProps } from "~/components/Class/StatsCard.vue"

const classId = useRoute().params.classId?.toString()
const classIdError = !classId ? new Error("Class was not found") : undefined

const { data, isPending, error } = useGetSingleClass(classId as string)
const currclass = computed(() => data.value)
const classTeacher = computed(() => data.value?.teacher || null)

const classStats = computed<StatsCardProps[]>(() => {
  return [
    { label: "Total Students", value: "35", icon: ICONS.students as string },
    { label: "Total Results", value: "15", icon: ICONS.result as string }
  ]
})

const isSheetOpen = ref(false)
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
      navigateTo("/admin/classes")
      return "Class was deleted successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page
    :title="currclass?.name"
    :description="classTeacher ? `Class Teacher: ${classTeacher.name}` : 'No teacher'"
    :loading="isPending"
    :error="classIdError ?? error ?? undefined"
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

        <!-- Confirm Delete CurrClass -->
        <AppConfirmDeleteAction
          description="Are you sure you want to delete this class? You will loose all results for this class"
          :confirm-input-text="currclass?.name"
          @confirm="handleDeleteAction"
        >
          <ui-button size="sm" :icon="ICONS.delete" variant="destructive" text="Delete" />
        </AppConfirmDeleteAction>
      </UiButtonGroup>
    </template>

    <!-- Class Stats -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <!-- Class Stats -->
      <ClassStatsCard v-for="item in classStats" v-bind="item" />
    </div>

    <!-- Class students Table -->

    <!-- CurrClass Edit Form -->
    <LazyClassUpsertForm
      @submit="handleUpdateClass"
      :initial-data="currclass"
      v-model:open="isSheetOpen"
      mode="Edit"
    />
  </Page>
</template>
