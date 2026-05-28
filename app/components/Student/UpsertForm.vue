<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { UpsertStudentSchema, type UpsertStudentInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertStudentInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertStudentInput]; close: [] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { data } = useListClasses()
const classes = computed(() => {
  return (
    data.value?.map((curr) => ({
      value: curr.id,
      label: curr.name
    })) || []
  )
})

const { handleSubmit, isSubmitting } = useForm<UpsertStudentInput>({
  validationSchema: toTypedSchema(UpsertStudentSchema),
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
      :title="`${mode} Student`"
      class="w-full sm:max-w-none md:w-100"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} student`"
    >
      <template #content>
        <form id="student-form" @submit.prevent="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Student Name"
              placeholder="Enter the student's name"
              description="Full name of the student"
            />

            <FormInput
              name="studentId"
              label="Student ID"
              placeholder="Enter student ID (optional)"
              description="Optional student identifier (e.g., STU-2026-001)"
            />

            <FormSelect
              name="classId"
              label="Class"
              :options="classes"
              placeholder="Select a class for the student"
              description="Required - student must be assigned to a class"
            />

            <FormInput
              name="phoneNumber"
              label="Phone Number"
              placeholder="Enter phone number (optional)"
              description="Optional contact number"
              type="tel"
            />
          </fieldset>
        </form>
      </template>

      <template #footer>
        <UiSheetFooter>
          <div class="w-full flex gap-1">
            <UiSheetClose as-child>
              <UiButton
                @click="$emit('close')"
                class="flex-1"
                variant="outline"
                type="button"
                :disabled="isSubmitting"
              >
                Cancel
              </UiButton>
            </UiSheetClose>
            <UiButton
              class="flex-1"
              type="submit"
              form="student-form"
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
