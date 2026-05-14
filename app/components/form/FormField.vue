<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  validateOnMount: false,
})

const inputId = useId()

const field = useField<unknown>(() => props.name || inputId, undefined, {
  label: props.label,
  validateOnMount: props.validateOnMount,
  syncVModel: true,
})

const isInvalid = computed(() => !!field.errorMessage.value)

defineExpose({ inputId, field, isInvalid })
</script>

<template>
  <Field
    :class="props.class"
    :data-invalid="isInvalid || undefined"
    class="flex flex-col gap-1.5 w-full"
  >
    <FieldLabel v-if="label" :for="inputId">
      {{ label }}
    </FieldLabel>

    <slot :input-id="inputId" :field="field" :is-invalid="isInvalid" />

    <FieldDescription v-if="description && !isInvalid" :id="`${inputId}-desc`">
      {{ description }}
    </FieldDescription>

    <FieldError v-if="isInvalid">
      {{ field.errorMessage.value }}
    </FieldError>
  </Field>
</template>
