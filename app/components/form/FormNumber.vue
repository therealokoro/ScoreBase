<script setup lang="ts">
interface Props {
  name: string
  validateOnMount?: boolean
  label?: string
  description?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  formatOptions?: Intl.NumberFormatOptions
  class?: string

  // addon props
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false
})

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
      <UiNumberField
        :value="value"
        :min
        :max
        :step
        :disabled
        :format-options="formatOptions"
        :id="id"
        @input="handleChange"
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="description ? `${id}-desc` : undefined"
        @blur="handleBlur()"
      />
    </template>
  </FormField>
</template>
