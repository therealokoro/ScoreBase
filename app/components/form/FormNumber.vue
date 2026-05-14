<script setup lang="ts">
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { cn } from '@/lib/utils'
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
    <NumberField
      v-model="model"
      :min
      :max
      :step
      :disabled
      :format-options="formatOptions"
    >
      <NumberFieldContent
        data-slot="input-group-control"
        :class="cn(
          'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-within:ring-0',
          isInvalid && 'border-destructive! focus-within:ring-destructive/30!',
        )"
      >
        <NumberFieldDecrement />
        <NumberFieldInput
          :id="inputId"
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="description ? `${inputId}-desc` : undefined"
          @blur="field.handleBlur()"
        />
        <NumberFieldIncrement />
      </NumberFieldContent>
    </NumberField>
  </FormField>
</template>
