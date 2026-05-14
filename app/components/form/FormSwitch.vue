<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import FormField from './FormField.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  disabled?: boolean
  position?: 'left' | 'right'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  position: 'left',
})

const model = defineModel<boolean>()
</script>

<template>
  <FormField
    :name
    :validate-on-mount
    :class="props.class"
    v-slot="{ inputId, field, isInvalid }"
  >
    <div class="flex flex-col gap-1.5">
      <div
        class="flex items-start gap-4"
        :class="position === 'right' ? 'flex-row-reverse justify-start' : 'flex-row justify-between'"
      >
        <Switch
          :id="inputId"
          v-model:checked="model"
          :disabled
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="description ? `${inputId}-desc` : undefined"
          class="shrink-0"
          @update:checked="field.handleBlur()"
        />

        <div v-if="label || description || $slots['label']" class="flex flex-col gap-0.5">
          <FieldLabel
            :for="inputId"
            :class="disabled && 'cursor-not-allowed opacity-50'"
          >
            <slot name="label">{{ label }}</slot>
          </FieldLabel>

          <FieldDescription v-if="description && !isInvalid" :id="`${inputId}-desc`">
            {{ description }}
          </FieldDescription>
        </div>
      </div>

      <FieldError v-if="isInvalid">
        {{ field.errorMessage.value }}
      </FieldError>
    </div>
  </FormField>
</template>
