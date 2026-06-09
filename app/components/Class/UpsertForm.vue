<script lang="ts" setup>
import { type UpsertClassInput } from "~~/shared/validators/academic"

const props = defineProps<{
  initialData?: UpsertClassInput
  mode: "Edit" | "Create"
}>()

const initiaValue = computed(() => ({
  name: props.initialData?.name,
  teacherId: props.initialData?.teacherId
}))

const emit = defineEmits<{ submit: [payload: UpsertClassInput] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

// Hoist FormKit's loading state out of the slot
const isSubmitting = ref(false)

const { data } = useListTeachers()
const teachers = computed(() => {
  return (
    data.value?.map((curr) => ({
      value: curr.id,
      label: curr.name,
      disabled: Boolean(curr.class?.id)
    })) || []
  )
})

async function onSubmit(payload: UpsertClassInput) {
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
      :title="`${mode} Class`"
      class="w-full sm:max-w-none md:w-100"
      :description="`${mode === 'Create' ? 'Create a new' : 'Update a'} class`"
    >
      <template #content>
        <FormKit
          :value="initiaValue"
          id="class-form"
          type="form"
          :actions="false"
          @submit="onSubmit"
        >
          <fieldset :disabled="isSubmitting" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit
              type="text"
              name="name"
              label="Class Name"
              placeholder="Enter the class name here"
              help="e.g JSS1 or JSS1A"
              validation="required"
            />

            <FormKit
              type="_select"
              name="teacherId"
              label="Class Teacher"
              :options="teachers"
              placeholder="Select a teacher for the class"
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
