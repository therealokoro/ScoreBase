<script setup lang="ts">
import { computed, useSlots } from 'vue'
import FormField from './FormField.vue'
import FormAddon from './FormAddon.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  readonly?: boolean
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  validateOnMount: false,
})

const model = defineModel<string>()

const slots = useSlots()
const hasAddonStart = computed(() => !!slots['addon']       || !!props.icon || !!props.addonText)
const hasAddonEnd   = computed(() => !!slots['addon-right'] || !!props.iconRight || !!props.addonTextRight)
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
    <UiInputGroup>
      <FormAddon v-if="hasAddonStart" :icon :text="addonText">
        <template v-if="$slots['addon']" #default>
          <slot name="addon" />
        </template>
      </FormAddon>

      <UiInputGroupInput
        :id="inputId"
        :type
        :placeholder
        :disabled
        :readonly
        v-model="model"
        :aria-describedby="description ? `${inputId}-desc` : undefined"
        :aria-invalid="isInvalid || undefined"
        class="aria-invalid:border-destructive! aria-invalid:ring-destructive/20! aria-invalid:focus-visible:ring-destructive/30!"
        @blur="field.handleBlur"
      />

      <FormAddon v-if="hasAddonEnd" :icon="iconRight" :text="addonTextRight" align="inline-end">
        <template v-if="$slots['addon-right']" #default>
          <slot name="addon-right" />
        </template>
      </FormAddon>
    </UiInputGroup>
  </FormField>
</template>
