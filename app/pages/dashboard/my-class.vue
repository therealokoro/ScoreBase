<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

definePageMeta({ middleware: ["teacher-only"] })

const { user, isPending } = useAuth()

const { $orpc } = useNuxtApp()
const queryKey = computed(() => `${user.value?.id ?? "unknown"}-class-fetch`)
const { data, pending, refresh } = useLazyAsyncData(queryKey, () => {
  const teacherId = user.value?.id
  if (!teacherId) return Promise.resolve(undefined)
  return $orpc.teacher.getClass.call({ teacherId })
})

const currClass = computed(() => data.value)

// Dynamically set the breadcrumb label once data is loaded
setPageBreadcrumbLabel(computed(() => currClass.value?.name))

const isSheetOpen = ref(false)
const updateClass = useUpdateClass()

function handleUpdateClass(payload: any) {
  useSonner.promise(updateClass.mutateAsync(payload), {
    loading: "Updating class info...",
    success: () => {
      refresh()
      isSheetOpen.value = false
      return "Class was updated successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page
    :title="currClass?.name || 'No Class'"
    :loading="isPending || pending"
    :badge="currClass ? `Teacher: ${currClass.teacher?.name}` : undefined"
  >
    <AppContentPlaceholder
      v-if="!currClass"
      title="Oops, No Class"
      text="Looks like you haven't been assigned to any class. Contact your admin to assign a class to you"
    />

    <!-- When the teacher has a class -->
    <template v-else>
      <!-- Class Stats and Subject List View -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Show class subject list preset -->
        <ClassSubjectPresetControl :active-class="currClass" @onMutation="() => refresh()" />
      </div>

      <!-- Render students in a table -->
      <StudentListTable :class-id="currClass?.id" :show-create-button="true" />
    </template>

    <!-- currClass Edit Form -->
    <LazyClassUpsertForm
      v-if="currClass && isSheetOpen"
      :key="isSheetOpen.toString()"
      mode="Edit"
      :submitting="updateClass.isPending.value"
      @submit="handleUpdateClass"
      :initial-data="currClass"
      v-model:open="isSheetOpen"
    />
  </Page>
</template>
