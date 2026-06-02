<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { SUBJECT_TAGS } from "~~/shared/constants/data"
import { UpsertSubjectSchema, type UpsertSubjectInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertSubjectInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertSubjectInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { handleSubmit, isSubmitting } = useForm<UpsertSubjectInput>({
  validationSchema: toTypedSchema(UpsertSubjectSchema),
  initialValues: props.initialData ?? {}
})

const onSubmit = handleSubmit((payload) => {
  emit("submit", payload)
})
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
        <form id="subject-form" @submit="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Subject Name"
              placeholder="Enter the subject name here"
              description="e.g JSS1 or JSS1A"
            />

            <FormSelect
              multiple
              name="tags"
              label="Tags"
              :options="SUBJECT_TAGS"
              placeholder="Select one or multiple tags for the subject"
              description="This is used to categorize and filter the subjects"
            />
          </fieldset>
        </form>
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
