<script lang="ts" setup>
import { type UpsertAcademicSessionInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertAcademicSessionInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [session: UpsertAcademicSessionInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const isSubmitting = ref(false)
async function onSubmit(payload: UpsertAcademicSessionInput) {
  isSubmitting.value = true
  try {
    emit("submit", payload)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UiSheet v-model:open="isSheetOpen">
    <UiSheetContent
      class="w-full sm:max-w-none md:w-100"
      side="right"
      :title="`${mode} Academic Session`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update an'} academic session`"
    >
      <template #content>
        <FormKit
          type="form"
          id="session-form"
          :actions="false"
          :value="initialData"
          @submit="onSubmit"
        >
          <fieldset :disabled="isSubmitting" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit
              name="name"
              label="Session Name"
              placeholder="Enter the session name here"
              help="e.g 2024/2025 Session"
              validation="required"
            />
          </fieldset>
        </FormKit>
      </template>

      <template #footer>
        <UiSheetFooter>
          <div class="w-full flex gap-1">
            <UiSheetClose as-child>
              <UiButton class="flex-1" variant="outline" type="button" :disabled="isSubmitting">
                Cancel
              </UiButton>
            </UiSheetClose>
            <UiButton
              class="flex-1"
              type="submit"
              form="session-form"
              :disabled="isSubmitting"
              :loading="isSubmitting"
            >
              {{ isSubmitting ? "Submitting..." : "Submit" }}
            </UiButton>
          </div>
        </UiSheetFooter>
      </template>
    </UiSheetContent>
  </UiSheet>
</template>
