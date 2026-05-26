<script setup lang="ts">
import type { AcceptableValue } from "reka-ui"

import type { SelectOptionRaw } from "../Ui/Select/Select.vue"
import FormField from "./FormField.vue"

interface Props {
  name: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  options?: SelectOptionRaw[]
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  multiple: false,
  options: () => []
})

type FinalValueType = AcceptableValue | AcceptableValue[]
const { value, errorMessage } = useField<FinalValueType>(() => props.name, undefined, {
  label: props.label,
  validateOnMount: props.validateOnMount,
  syncVModel: true
})
</script>

<template>
  <FormField
    :icon
    :label
    :class
    :icon-right
    :addon-text
    :description
    :addon-text-right
    :error="errorMessage"
  >
    <template #default="{ isInvalid }">
      <UiSelect
        v-model="value"
        :options
        :disabled
        :multiple
        v-slot="{ options: normalizedOptions }"
      >
        <UiSelectTrigger
          data-slot="input-group-control"
          :aria-invalid="isInvalid || undefined"
          class="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 aria-invalid:border-destructive! aria-invalid:focus-visible:ring-destructive/30!"
        >
          <UiSelectValue :placeholder />
        </UiSelectTrigger>

        <UiSelectContent>
          <slot :options="normalizedOptions">
            <UiSelectItem v-for="option in normalizedOptions" :key="option.value" v-bind="option">
              {{ option.label }}
            </UiSelectItem>
          </slot>
        </UiSelectContent>
      </UiSelect>
    </template>
  </FormField>
</template>
