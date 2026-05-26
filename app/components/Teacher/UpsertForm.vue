<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod"
import { useForm } from "vee-validate"
import { UpsertTeacherSchema, type UpsertTeacherInput } from "~~/shared/validators/actors"

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

const { handleSubmit, isSubmitting } = useForm<UpsertTeacherInput>({
  validationSchema: toTypedSchema(UpsertTeacherSchema),
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
      :title="`${mode} Teacher`"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update'} teacher's info`"
    >
      <template #content>
        <form id="teacher-form" @submit="onSubmit">
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormInput
              name="name"
              label="Full Name"
              placeholder="Enter the teacher's full name here"
              description="e.g John Emeka Olabisi"
            />

            <FormInput
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter the teacher's email address here"
              description="e.g john@gmail.com"
            />

            <FormInput
              type="tel"
              name="phoneNumber"
              label="Phone Number"
              placeholder="Enter the teacher's phone number here"
              description="e.g 09012345678"
            />

            <FormSelect
              name="classId"
              label="Class"
              :options="classes"
              placeholder="Pick a class to assign the teacher to"
              description="This is optional and can be done later"
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
