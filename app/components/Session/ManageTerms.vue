<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const props = defineProps<{ terms: ITerm[]; sessionId: string }>()
const emit = defineEmits<{ selectTerm: [ITerm] }>()
const activeTerm = ref<ITerm | null>(null)
const isDeleteSheetOpen = ref(false)

function initDeleteTerm(term: ITerm) {
  activeTerm.value = term
  isDeleteSheetOpen.value = true
}

const deleteMutation = useDeleteSessionTerm()
function handleDeleteTerm() {
  useSonner.promise(deleteMutation.mutateAsync({ id: activeTerm.value!.id }), {
    loading: "Please wait, Deleting session term....",
    success: "Session term deleted successfully",
    error: (e: any) => e.message
  })
}

const createMutation = useCreateSessionTerm()
const handleCreateTerm = () => {
  useSonner.promise(createMutation.mutateAsync({ sessionId: props.sessionId }), {
    loading: "Please wait, Creating session term....",
    success: "Session term was created successfully",
    error: (e: any) => e.message
  })
}
</script>

<template>
  <!-- Session Terms -->
  <div class="w-full space-y-2">
    <h3 class="text-sm font-semibold">Session Terms</h3>
    <div class="flex flex-wrap gap-4">
      <UiButtonGroup v-for="item in terms">
        <ui-button variant="outline" @click="emit('selectTerm', item)">
          {{ item.name }}
        </ui-button>

        <ui-button variant="outline" :icon="ICONS.delete" @click="initDeleteTerm(item)" />
      </UiButtonGroup>

      <UiButton
        @click="handleCreateTerm"
        :loading="createMutation.isPending.value"
        :disabled="createMutation.isPending.value"
        :icon="ICONS.add"
        text="Add Term"
        variant="outline"
      />

      <!-- Confirm Term Deletion -->
      <AppConfirmDeleteAction
        v-model:open="isDeleteSheetOpen"
        description="Are you sure you want to delete this term? You will loose all results associated with this term"
        :confirm-input-text="activeTerm?.name"
        @confirm="handleDeleteTerm"
      />
    </div>
  </div>
</template>
