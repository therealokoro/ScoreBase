<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { UpsertSubjectListSchema, type UpsertSubjectListInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertSubjectListInput
  mode: "Edit" | "Create"
}>()

const subjects = useListSubjects()
const subjectOptions = computed(
  () =>
    subjects.data.value?.map((curr) => ({
      name: curr.name,
      id: curr.id
    })) || []
)

const emit = defineEmits<{ submit: [payload: UpsertSubjectListInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(UpsertSubjectListSchema),
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
      :title="`${mode} Subject Lists`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} subject list preset`"
    >
      <template #content>
        <form id="subjectlist-form" @submit="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Name"
              placeholder="Enter a name for the preset here"
              description="e.g JSS1 or JSS1A"
            />

            <SubjectSelectCheckbox :options="subjectOptions" />
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
              form="subjectlist-form"
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
