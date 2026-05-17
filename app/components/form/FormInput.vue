<script setup lang="ts">
import { useField } from "vee-validate"

type Props = {
  name: string
  label?: string
  description?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  readonly?: boolean
  validateOnMount?: boolean
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), { type: "text" })

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.name,
  undefined,
  { label: props.label, validateOnMount: props.validateOnMount }
)
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
    <template #default="{ id, isInvalid }">
      <UiInputGroupInput
        :id
        :name
        :type
        :disabled
        :readonly
        :placeholder
        :value="value"
        @input="handleChange"
        @blur="handleBlur"
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="description ? `${id}-desc` : undefined"
        class="aria-invalid:border-destructive! aria-invalid:ring-destructive/20!"
      />
    </template>
  </FormField>
</template>
