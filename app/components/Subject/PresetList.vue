<script lang="ts" setup>
import type { UpsertSubjectListInput } from "~~/shared/validators/academic"

const openCreateSheet = ref(false)
const openEditSheet = ref(false)
const openDeleteDialog = ref(false)
const { $orpc } = useNuxtApp()

const { data, pending, refresh } = await useAsyncData("subject-list", () => $orpc.subjectList.list.call())

const presets = computed(() => data.value || [])
const activePreset = ref<ISubjectList | null>(null)

function initViewPreset(payload: ISubjectList) {
  activePreset.value = null
  nextTick(() => {
    activePreset.value = payload
    openEditSheet.value = true
  })
}

function initDeletePreset(payload: ISubjectList) {
  activePreset.value = null
  nextTick(() => {
    activePreset.value = payload
    openDeleteDialog.value = true
  })
}

const createSubjectList = useCreateSubjectList()
async function handleCreateSubjectList(payload: UpsertSubjectListInput) {
  activePreset.value = null
  useSonner.promise(createSubjectList.mutateAsync(payload), {
    loading: "Creating a new subject preset...",
    success: () => {
      refresh()
      openCreateSheet.value = false
      return "Subject preset created successfully"
    },
    error: (e: any) => e.message
  })
}

const updateSubjectList = useUpdateSubjectList()
async function handleUpdateSubjectList(payload: any) {
  useSonner.promise(updateSubjectList.mutateAsync(payload), {
    loading: "Updating the active preset...",
    success: () => {
      refresh()
      openEditSheet.value = false
      return "Subject preset was updated successfully"
    },
    error: (e: any) => e.message
  })
}

const deleteSubjectList = useDeleteSubjectList()
async function handleDeleteSubjectList() {
  useSonner.promise(deleteSubjectList.mutateAsync({ id: activePreset.value!.id }), {
    loading: "Deleting the selected preset...",
    success: () => {
      refresh()
      return "Subject preset was deleted successfully"
    },
    error: (e: any) => e.message
  })
}
</script>

<template>
  <div class="w-full">
    <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Loading -->
      <template v-if="pending">
        <UiSkeleton v-for="n in 3" class="w-full h-15 mb-4" />
      </template>

      <template v-else>
        <!-- Add Preset Button -->
        <AppEntityAddButton @click="openCreateSheet = true" text="Create a subject preset" />

        <AppEntityCard
          v-for="n in presets"
          no-icon
          :key="n.id"
          :title="n.name"
          :clickable="false"
          :description="`Contains ${n.subjects.length} subjects`"
        >
          <template #action>
            <AppEntityActionDropdown @edit="initViewPreset(n)" @delete="initDeletePreset(n)" />
          </template>
        </AppEntityCard>
      </template>
    </div>

    <!-- Form for creation -->
    <LazySubjectPresetUpsertForm
      mode="Create"
      v-model:open="openCreateSheet"
      @submit="handleCreateSubjectList"
    />

    <!-- form for edit -->
    <LazySubjectPresetUpsertForm
      v-if="activePreset"
      :key="activePreset.id"
      mode="Edit"
      :initial-data="activePreset"
      v-model:open="openEditSheet"
      @submit="handleUpdateSubjectList"
    />

    <!-- Dialog to confirm delete -->
    <LazyAppConfirmDeleteAction
      v-if="activePreset"
      v-model:open="openDeleteDialog"
      @confirm="handleDeleteSubjectList"
      description="Are you sure you want to delete this subject preset?"
    />
  </div>
</template>
