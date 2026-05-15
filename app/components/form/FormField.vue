<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'

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
  <UiField
    :class="props.class"
    :data-invalid="isInvalid || undefined"
    class="flex flex-col gap-1.5 w-full"
  >
    <UiFieldLabel v-if="label" :for="inputId">
      {{ label }}
    </UiFieldLabel>

    <slot :input-id="inputId" :field="field" :is-invalid="isInvalid" />

    <UiFieldDescription v-if="description && !isInvalid" :id="`${inputId}-desc`">
      {{ description }}
    </UiFieldDescription>

    <UiFieldError v-if="isInvalid">
      {{ field.errorMessage.value }}
    </UiFieldError>
  </UiField>
</template>
