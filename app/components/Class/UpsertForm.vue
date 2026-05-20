<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { UpsertClassSchema, type UpsertClassInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertClassInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertClassInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { handleSubmit, isSubmitting } = useForm<UpsertClassInput>({
  validationSchema: toTypedSchema(UpsertClassSchema),
  initialValues: props.initialData ?? {}
})

const onSubmit = handleSubmit((payload) => {
  emit("submit", payload)
})
</script>

<template>
  <UiSheet v-model:open="isSheetOpen">
    <UiSheetContent
      class="w-full sm:max-w-none md:w-100"
      side="right"
      :title="`${mode} Class`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} class`"
    >
      <template #content>
        <form id="class-form" @submit.prevent="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Class Name"
              placeholder="Enter the class name here"
              description="e.g JSS1 or JSS1A"
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
              form="class-form"
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
