<script setup lang="ts">
import { useId } from "vue"

import FormField from "./FormField.vue"

interface RadioOption {
  label: string
  value: string
  disabled?: boolean
}

type RadioOptionRaw = string | RadioOption

interface Props {
  name: string
  validateOnMount?: boolean
  label?: string
  description?: string
  disabled?: boolean
  options?: RadioOptionRaw[]
  inline?: boolean
  class?: string
  placeholder?: string
  type?: string
  readonly?: boolean
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  inline: false,
  options: () => []
})

const model = defineModel<string>()

const groupId = useId()

function normalizeOption(opt: RadioOptionRaw): RadioOption {
  return typeof opt === "string" ? { label: opt, value: opt } : opt
}

function optionId(value: string) {
  return `${groupId}-${value}`
}

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.name,
  undefined,
  {
    initialValue: model.value,
    syncVModel: true,
    label: props.label,
    validateOnMount: props.validateOnMount
  }
)
</script>

<template>
  <FormField :name :label :description :class="props.class" :error="errorMessage">
    <template #default="{ isInvalid }">
      <UiRadioGroup
        :value="value"
        :disabled
        :aria-invalid="isInvalid || undefined"
        :class="inline ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2'"
        @update:model-value="handleBlur()"
      >
        <slot :options="options.map(normalizeOption)">
          <div
            v-for="opt in options.map(normalizeOption)"
            :key="opt.value"
            class="flex items-center gap-2"
          >
            <UiRadioGroupItem
              :id="optionId(opt.value)"
              :value="opt.value"
              :disabled="opt.disabled ?? disabled"
            />
            <UiLabel
              :for="optionId(opt.value)"
              :class="(opt.disabled ?? disabled) && 'cursor-not-allowed opacity-50'"
            >
              {{ opt.label }}
            </UiLabel>
          </div>
        </slot>
      </UiRadioGroup>
    </template>
  </FormField>
</template>
