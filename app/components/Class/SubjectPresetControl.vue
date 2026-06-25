<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
const props = defineProps<{ activeClass: IClassWithSubjectList }>()
const emit = defineEmits<{ onMutation: [] }>()

const { $orpc } = useNuxtApp()
const { data } = useFetchSubjectLists()
const presets = computed(
  () =>
    data.value?.map((curr) => ({
      label: curr.name,
      value: curr.id
    })) || []
)

const selectedPreset = ref(props.activeClass.subjectListId)
const openDialog = ref(false)

const setSubjectList = useSetClassSubjectList()
function handleSubmit() {
  useSonner.promise(
    setSubjectList.mutateAsync({ id: props.activeClass.id, subjectListId: selectedPreset.value }),
    {
      loading: "Updating class subject list...",
      success: () => {
        openDialog.value = false
        emit("onMutation")
        return "Subject list updated successfully"
      },
      error: (e: any) => e.message
    }
  )
}

function initUnsetPreset() {
  selectedPreset.value = null
  handleSubmit()
}
</script>

<template>
  <UiTooltip>
    <template #trigger>
      <UiTooltipTrigger as-child>
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg border overflow-hidden',
            'text-xs hover:underline underline-offset-4',
            '[&>span]:flex-1 [&>span]:min-w-0 [&>span]:text-center [&>span]:truncate'
          ]"
          @click="openDialog = true"
        >
          <Icon :name="ICONS.subject" class="size-3 shrink-0" />
          <span v-if="!activeClass.subjectList">Set a subject list preset</span>
          <span class="text-primary" v-else>{{ activeClass.subjectList?.name }}</span>
        </button>
      </UiTooltipTrigger>
    </template>
    <template #content>
      <UiTooltipContent>
        <p>Set a subject list preset for this class</p>
      </UiTooltipContent>
    </template>
  </UiTooltip>

  <UiDialog v-model:open="openDialog">
    <UiDialogContent
      class="sm:max-w-106.25"
      title="Subjects List"
      description="Select a subjects list preset for this class"
    >
      <template #content>
        <UiLabel for="select-preset">Select a preset</UiLabel>
        <UiSelect
          v-if="presets.length"
          v-model="selectedPreset"
          :options="presets"
          id="select-preset"
          placeholder="Pick a preset to apply to the class"
        />
      </template>
      <template #footer>
        <UiDialogFooter>
          <UiButton
            variant="outline"
            type="button"
            class="mt-2 sm:mt-0"
            @click="openDialog = false"
          >
            Cancel
          </UiButton>
          <UiButton
            variant="destructive"
            type="button"
            class="mt-2 sm:mt-0"
            @click="initUnsetPreset()"
          >
            Unset Preset
          </UiButton>
          <UiButton type="submit" @click="handleSubmit">Save</UiButton>
        </UiDialogFooter>
      </template>
    </UiDialogContent>
  </UiDialog>
</template>
