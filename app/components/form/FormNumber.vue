<script setup lang="ts">
import FormField from './FormField.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  formatOptions?: Intl.NumberFormatOptions
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
})

const model = defineModel<number>()
</script>

<template>
  <FormField
    :name
    :validate-on-mount
    :label
    :description
    :class="props.class"
    v-slot="{ inputId, field, isInvalid }"
  >
    <UiNumberField
      v-model="model"
      :min
      :max
      :step
      :disabled
      :format-options="formatOptions"
    >
      <UiNumberFieldContent
        data-slot="input-group-control"
        class="flex-1 rounded-none border-0 bg-transparent shadow-none aria-invalid:border-destructive! aria-invalid:focus-within:ring-destructive/30!"
      >
        <UiNumberFieldDecrement />
        <UiNumberFieldInput
          :id="inputId"
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="description ? `${inputId}-desc` : undefined"
          @blur="field.handleBlur()"
        />
        <UiNumberFieldIncrement />
      </UiNumberFieldContent>
    </UiNumberField>
  </FormField>
</template>
