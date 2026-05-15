<script setup lang="ts">
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
        class="flex items-start gap-3"
        :class="position === 'right' ? 'flex-row-reverse justify-end' : 'flex-row'"
      >
        <UiCheckbox
          :id="inputId"
          v-model:checked="model"
          :disabled
          :aria-invalid="isInvalid || undefined"
          :aria-describedby="description ? `${inputId}-desc` : undefined"
          class="mt-0.5 shrink-0"
          @update:checked="field.handleBlur()"
        />

        <div v-if="label || description || $slots['label']" class="flex flex-col gap-0.5">
          <UiFieldLabel
            :for="inputId"
            :class="disabled && 'cursor-not-allowed opacity-50'"
          >
            <slot name="label">{{ label }}</slot>
          </UiFieldLabel>

          <UiFieldDescription v-if="description && !isInvalid" :id="`${inputId}-desc`">
            {{ description }}
          </UiFieldDescription>
        </div>
      </div>

      <UiFieldError v-if="isInvalid" class="pl-7">
        {{ field.errorMessage.value }}
      </UiFieldError>
    </div>
  </FormField>
</template>
