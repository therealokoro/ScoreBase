<script setup lang="ts">
import { useId } from 'vue'
import FormField from './FormField.vue'

interface RadioOption {
  label: string
  value: string
  disabled?: boolean
}

type RadioOptionRaw = string | RadioOption

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  disabled?: boolean
  options?: RadioOptionRaw[]
  inline?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  inline: false,
  options: () => [],
})

const model = defineModel<string>()

const groupId = useId()

function normalizeOption(opt: RadioOptionRaw): RadioOption {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt
}

function optionId(value: string) {
  return `${groupId}-${value}`
}
</script>

<template>
  <FormField
    :name
    :validate-on-mount
    :label
    :description
    :class="props.class"
    v-slot="{ field, isInvalid }"
  >
    <UiRadioGroup
      v-model="model"
      :disabled
      :aria-invalid="isInvalid || undefined"
      :class="inline ? 'flex flex-wrap gap-x-6 gap-y-2' : 'flex flex-col gap-2'"
      @update:model-value="field.handleBlur()"
    >
      <slot :options="options.map(normalizeOption)">
        <div
          v-for="opt in options.map(normalizeOption)"
          :key="opt.value"
          class="flex items-center gap-2"
        >
          <RadioGroupItem
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
  </FormField>
</template>
