<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { UpsertTeacherInput } from "~~/shared/validators/actors"

const { data, pending, error, refresh } = await useAsyncData("teachers-list", () => {
  const { $orpc } = useNuxtApp()
  return $orpc.teacher.list.call()
})

const teachers = computed(() => data.value || [])
const activeTeacher = ref<ITeacher | null>(null)

const openCreateSheet = ref(false)
const createTeacher = useCreateTeacher()
function handleCreateAction(payload: UpsertTeacherInput) {
  useSonner.promise(createTeacher.mutateAsync(payload), {
    loading: "Creating new teacher, please wait...",
    success: () => {
      refresh()
      openCreateSheet.value = false
      return "New teacher was created successfully"
    },
    error: (err: any) => err.message
  })
}

const openUpdateSheet = ref(false)
function initUpdateAction(payload: ITeacher) {
  activeTeacher.value = null
  nextTick(() => {
    activeTeacher.value = {
      ...payload,
      classId: payload.class?.id
    } as ITeacher
    openUpdateSheet.value = true
  })
}

const updateTeacher = useUpdateTeacher()
function handleUpdateAction(payload: any) {
  useSonner.promise(updateTeacher.mutateAsync({ ...payload, id: activeTeacher.value?.id }), {
    loading: "Updating teacher's info, please wait...",
    success: () => {
      refresh()
      openUpdateSheet.value = false
      return "Teacher's info was updated successfully"
    },
    error: (err: any) => err.message
  })
}

function initDeleteAction(payload: ITeacher) {
  activeTeacher.value = null
  nextTick(() => {
    activeTeacher.value = payload
    openDeleteDialog.value = true
  })
}

const openDeleteDialog = ref(false)
const deleteTeacher = useDeleteTeacher()
function handleDeleteAction() {
  useSonner.promise(deleteTeacher.mutateAsync({ id: activeTeacher.value!.id }), {
    loading: "Deleting teacher's info, please wait...",
    success: () => {
      refresh()
      openDeleteDialog.value = false
      return "Teacher's info was deleted successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page
    :error
    :loading="pending"
    title="Class teachers"
    description="This is a list of all teachers. Create, edit and delete Teachers"
    class="justify-between flex-wrap"
  >
    <template #actions>
      <ui-button size="sm" :icon="ICONS.add" @click="openCreateSheet = true">
        Create a Teacher
      </ui-button>
    </template>

    <!-- Teachers List -->
    <TeacherList :teachers @edit="initUpdateAction" @delete="initDeleteAction" />

    <!-- Form for create -->
    <LazyTeacherUpsertForm
      mode="Create"
      @submit="handleCreateAction"
      v-model:open="openCreateSheet"
    />

    <!-- Form for teacher's update -->
    <LazyTeacherUpsertForm
      mode="Edit"
      v-if="activeTeacher"
      v-model:open="openUpdateSheet"
      :initial-data="activeTeacher"
      @submit="handleUpdateAction"
    />

    <!-- Confirm Delete CurrClass -->
    <AppConfirmDeleteAction
      v-if="activeTeacher"
      v-model:open="openDeleteDialog"
      description="Are you sure you want to delete this teacher?"
      :confirm-input-text="activeTeacher?.name"
      @confirm="handleDeleteAction"
    />
  </Page>
</template>
