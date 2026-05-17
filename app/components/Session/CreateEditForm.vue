<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import {
  UpsertAcademicSessionSchema,
  type UpsertAcademicSessionInput
} from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertAcademicSessionInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [session: UpsertAcademicSessionInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { handleSubmit, isSubmitting } = useForm<UpsertAcademicSessionInput>({
  validationSchema: toTypedSchema(UpsertAcademicSessionSchema),
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
      :title="`${mode} Academic Session`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update an'} academic session`"
    >
      <template #content>
        <form id="session-form" @submit.prevent="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Session Name"
              placeholder="Enter the session name here"
              description="e.g 2024/2025 Session"
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
