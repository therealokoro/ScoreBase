<script lang="ts" setup>
import { type UpsertTeacherInput } from "~~/shared/validators/actors"

const props = defineProps<{
  initialData?: UpsertTeacherInput
  mode: "Edit" | "Create"
}>()

const emit = defineEmits<{ submit: [payload: UpsertTeacherInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

const { data } = useListClasses()
const classes = computed(() => {
  return data.value?.map((curr) => ({ value: curr.id, label: curr.name })) || []
})

const isSubmitting = ref(false)
async function onSubmit(payload: UpsertTeacherInput) {
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
      :title="`${mode} Teacher`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update'} teacher's info`"
    >
      <template #content>
        <FormKit
          type="form"
          :actions="false"
          :value="initialData"
          id="teacher-form"
          @submit="onSubmit"
        >
          <fieldset :disabled="isSubmitting" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit
              name="name"
              label="Full Name"
              placeholder="Enter the teacher's full name here"
              help="e.g John Emeka Olabisi"
              validation="required"
            />

            <FormKit
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter the teacher's email address here"
              help="e.g john@gmail.com"
              validation="required|email"
            />

            <FormKit
              type="tel"
              name="phoneNumber"
              label="Phone Number"
              placeholder="Enter the teacher's phone number here"
              help="e.g 09012345678"
              validation="required"
            />

            <FormKit
              type="_select"
              name="classId"
              label="Class"
              :options="classes"
              placeholder="Pick a class to assign the teacher to"
              help="This is optional and can be done later"
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
              form="teacher-form"
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
