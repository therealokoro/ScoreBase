<script lang="ts" setup>
import { createInput } from "@formkit/vue"
import { type UpsertSubjectListInput } from "~~/shared/validators/academic"

import SelectCheckbox from "./SelectCheckbox.vue"

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

const isSubmitting = ref(false)
async function handleSubmit(payload: any) {
  isSubmitting.value = true
  try {
    isSubmitting.value = false
    emit("submit", payload)
  } finally {
    isSubmitting.value = false
  }
}

const subjectCheckboxes = createInput(SelectCheckbox, { props: ["subjects"] })
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
        <FormKit
          type="form"
          :value="initialData"
          id="subjectlist-form"
          :actions="false"
          @submit="handleSubmit"
        >
          <fieldset :disabled="isSubmitting" class="flex flex-col gap-4 p-4">
            <FormKitMessages />

            <FormKit
              name="name"
              label="Name"
              placeholder="Enter a name for the preset here"
              help="e.g JSS1 or JSS1A"
              validation="required"
            />

            <FormKit
              :type="subjectCheckboxes"
              name="subjects"
              label="Subjects"
              help="Select a minimum of one subject to be added to the list"
              :subjects="subjectOptions"
              inner-class="border-0 ring-0"
              validation="required|min:1"
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
