<script setup lang="ts">
import { computed, useSlots } from 'vue'
import FormField from './FormField.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
  maxlength?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  validateOnMount: false,
})

const model = defineModel<string>()

const slots = useSlots()
const hasBlockStart = computed(() => !!slots['block-start'])
const hasBlockEnd   = computed(() => !!slots['block-end'])

const length = computed(() => model.value?.length ?? 0)
</script>

<template>
  <FormField
    :name
    :label
    :description
    :validate-on-mount
    :class="props.class"
    v-slot="{ inputId, field, isInvalid }"
  >
    <UiInputGroup>
      <UiInputGroupAddon v-if="hasBlockStart" align="block-start">
        <slot
          name="block-start"
          :value="model"
          :length="length"
          :maxlength="maxlength"
        />
      </UiInputGroupAddon>

      <UiInputGroupTextarea
        :id="inputId"
        :rows
        :disabled
        :readonly
        :maxlength
        :placeholder
        v-model="model"
        :aria-describedby="description ? `${inputId}-desc` : undefined"
        :aria-invalid="isInvalid || undefined"
        class="aria-invalid:border-destructive! aria-invalid:ring-destructive/20! aria-invalid:focus-visible:ring-destructive/30!"
        @blur="field.handleBlur()"
      />

      <UiInputGroupAddon v-if="hasBlockEnd" align="block-end">
        <slot
          name="block-end"
          :value="model"
          :length="length"
          :maxlength="maxlength"
        />
      </UiInputGroupAddon>
    </UiInputGroup>
  </FormField>
</template>