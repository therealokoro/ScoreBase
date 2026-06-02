<script lang="ts" setup>
const props = defineProps<{ subject: ISubject }>()
const openEditSheet = ref(false)
const openDeleteSheet = ref(false)
const emits = defineEmits(["on-mutation"])

const updateSubject = useUpdateSubject()
function handleUpdateSubject(payload: any) {
  useSonner.promise(updateSubject.mutateAsync(payload), {
    loading: "Updating subject info...",
    success: () => {
      openEditSheet.value = false
      emits("on-mutation")
      return "Subject info was updated successfully"
    },
    error: (err: any) => err.message
  })
}

const deleteSubject = useDeleteSubject()
function handleDeleteSubject() {
  useSonner.promise(deleteSubject.mutateAsync(props.subject), {
    loading: "Deleting subject info...",
    success: () => {
      emits("on-mutation")
      return "Subject was deleted successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <UiCard class="group relative justify-center gap-2 px-4">
    <UiCardTitle>{{ subject.name }}</UiCardTitle>
    <div class="w-full flex flex-wrap gap-2">
      <UiBadge v-for="tag in subject.tags" variant="secondary">{{ tag }}</UiBadge>
    </div>

    <div class="absolute flex items-center inset-y-0 right-4 z-2">
      <AppEntityActionDropdown @edit="openEditSheet = true" @delete="openDeleteSheet = true" />
    </div>

    <LazySubjectUpsertForm
      mode="Edit"
      :key="subject.id"
      :initial-data="subject"
      v-model:open="openEditSheet"
      @submit="handleUpdateSubject"
      v-if="openEditSheet && subject"
    />

    <AppConfirmDeleteAction
      v-model:open="openDeleteSheet"
      :description="`Are you sure you want to delete ${subject.name} subject? This cannot be undone.`"
      @confirm="handleDeleteSubject"
    />
  </UiCard>
</template>
