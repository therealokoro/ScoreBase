<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import { type UpsertStudentInput } from "~~/shared/validators/academic"

const { $orpc } = useNuxtApp()
const { data, pending, refresh } = useAsyncData("student-list", () => {
  return $orpc.student.list.call()
})

const students = computed(() => {
  return (
    data.value?.map((curr) => ({
      ...curr,
      createdAt: formatDate(curr.createdAt)
    })) || []
  )
})

const openCreateSheet = ref(false)
const createStudent = useCreateStudent()
async function handleCreateStudent(payload: UpsertStudentInput) {
  useSonner.promise(createStudent.mutateAsync(payload), {
    loading: "Creating student, please wait....",
    success: (d: any) => {
      refresh()
      openCreateSheet.value = false
      return `${d.name} was created successfully`
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page :loading="pending" title="Students" description="Create, edit, delete student records">
    <div class="w-full space-y-4">
      <div class="w-full flex items-center justify-between">
        <div></div>
        <ui-button @click="openCreateSheet = true" :icon="ICONS.add">Add Student</ui-button>
      </div>

      <div v-if="!students.length" class="w-full border-2 rounded-lg border-dashed">
        <UiEmpty
          title="No students to display"
          description="There are no students yet to display, create some to get started"
        />
      </div>

      <StudentFullTable v-else :data="students" />
    </div>

    <LazyStudentUpsertForm
      mode="Create"
      v-model:open="openCreateSheet"
      @submit="handleCreateStudent"
    />
  </Page>
</template>
