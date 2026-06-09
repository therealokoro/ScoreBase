<script lang="ts" setup>
import { SUBJECT_TAGS } from "~~/shared/constants/data"
import { type UpsertSubjectInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertSubjectInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertSubjectInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const isSubmitting = ref(false)
async function onSubmit(payload: UpsertSubjectInput) {
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
      side="right"
      class="w-full sm:max-w-none md:w-100"
      :title="`${mode} Subject`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} subject`"
    >
      <template #content>
        <FormKit
          type="form"
          id="subject-form"
          :actions="false"
          :value="initialData"
          @submit="onSubmit"
        >
          <fieldset :disabled="isSubmitting" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit
              name="name"
              label="Subject Name"
              placeholder="Enter the subject name here"
              help="e.g JSS1 or JSS1A"
              validation="required"
            />

            <FormKit
              type="_select"
              multiple
              name="tags"
              label="Tags"
              :options="SUBJECT_TAGS"
              placeholder="Select one or multiple tags for the subject"
              help="This is used to categorize and filter the subjects"
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
              form="subject-form"
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
