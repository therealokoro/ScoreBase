<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { UpsertStudentSchema, type UpsertStudentInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: Partial<UpsertStudentInput>
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertStudentInput]; close: [] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { data } = useListClasses()
const classes = computed(
  () =>
    data.value?.map((c) => {
      return { value: c.id, label: c.name }
    }) ?? []
)

// ─── Form ─────────────────────────────────────────────────────────────────────

const { handleSubmit, isSubmitting } = useForm<UpsertStudentInput>({
  validationSchema: toTypedSchema(UpsertStudentSchema),
  initialValues: props.initialData ?? {}
})

const onSubmit = handleSubmit((payload) => emit("submit", payload))

// True when creating a student from within a class page —
// classId is pre-filled and the select should be locked
const isCreateStudentForClass = computed(
  () => props.mode === "Create" && Boolean(props.initialData?.classId)
)
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
        <!--
          Delay mounting the form until classes have loaded.
          This ensures Reka UI's select can match the initial classId
          value to a label immediately on mount — avoiding the blank
          select issue when initialData.classId is pre-filled.
        -->
        <div v-if="!classes.length" class="flex flex-col gap-4 p-4">
          <UiSkeleton v-for="n in 4" :key="n" class="h-9 w-full" />
        </div>

        <form v-else id="student-form" @submit.prevent="onSubmit">
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

            <!--
              Disabled when creating from a class page (classId is pre-filled).
              The field still shows the class name but can't be changed.
            -->
            <FormSelect
              name="classId"
              label="Class"
              :options="classes"
              :disabled="isCreateStudentForClass"
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
          <div class="flex w-full gap-1">
            <UiSheetClose as-child>
              <UiButton
                class="flex-1"
                variant="outline"
                type="button"
                :disabled="isSubmitting"
                @click="$emit('close')"
              >
                Cancel
              </UiButton>
            </UiSheetClose>
            <UiButton
              class="flex-1"
              type="submit"
              form="student-form"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Submitting..." : "Submit" }}
            </UiButton>
          </div>
        </UiSheetFooter>
      </template>
    </UiSheetContent>
  </UiSheet>
</template>
