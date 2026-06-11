<script lang="ts" setup>
import { type UpsertStudentInput } from "~~/shared/validators/academic"

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

const isSubmitting = ref(false)
async function onSubmit(payload: UpsertStudentInput) {
  isSubmitting.value = true
  try {
    emit("submit", payload)
  } finally {
    isSubmitting.value = false
  }
}

// True when creating a student from within a class page —
// classId is pre-filled and the select should be locked
const isCreateStudentForClass = computed(
  () => props.mode === "Create" && Boolean(props.initialData?.classId)
)

const autoGenerateStudentId = ref(true)
</script>

<template>
  <UiSheet v-model:open="isSheetOpen">
    <UiSheetContent
      side="right"
      :title="`${mode} Student`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} student`"
      class="w-full sm:max-w-none md:w-100"
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

        <FormKit
          v-else
          type="form"
          id="student-form"
          :actions="false"
          :value="initialData"
          @submit="onSubmit"
        >
          <fieldset :disabled="isSubmitting" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit
              name="name"
              label="Student Name"
              placeholder="Enter the student's name"
              help="Full name of the student"
              validation="required"
            />

            <!--
              Disabled when creating from a class page (classId is pre-filled).
              The field still shows the class name but can't be changed.
            -->
            <FormKit
              type="_select"
              name="classId"
              label="Class"
              :options="classes"
              :disabled="isCreateStudentForClass"
              placeholder="Select a class for the student"
              help="Required - student must be assigned to a class"
              validation="required"
            />

            <FormKit
              type="number"
              name="phoneNumber"
              label="Phone Number"
              placeholder="Enter phone number (optional)"
              help="Optional contact number"
              validation="number|exactLength:11"
            />

            <FormKit
              type="checkbox"
              name="autoGenerateStudentId"
              label="Auto generate student IDs"
              help="Choose whether to generate student IDs automatically or manually"
              v-model="autoGenerateStudentId"
            />

            <FormKit
              v-if="!autoGenerateStudentId"
              name="studentId"
              label="Student ID"
              placeholder="Enter student ID"
              help="Optional student identifier (e.g., STU-2026-001)"
              validation="required"
            />
          </fieldset>
        </FormKit>
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
