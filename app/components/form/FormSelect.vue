<script setup lang="ts">
import { computed, useSlots } from 'vue'
import FormField from './FormField.vue'
import FormAddon from './FormAddon.vue'
import type { SelectOptionRaw } from '../Ui/Select/Select.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  options?: SelectOptionRaw[]
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  options: () => [],
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
    v-slot="{ field, isInvalid }"
  >
    <UiSelect
      v-model="model"
      :options
      :disabled
      v-slot="{ options: normalizedOptions }"
      @update:open="(open) => !open && field.handleBlur()"
    >
      <UiInputGroup>
        <FormAddon v-if="hasAddonStart" :icon :text="addonText">
          <template v-if="$slots['addon']" #default>
            <slot name="addon" />
          </template>
        </FormAddon>

        <UiSelectTrigger
          data-slot="input-group-control"
          :aria-invalid="isInvalid || undefined"
          class="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 aria-invalid:border-destructive! aria-invalid:focus-visible:ring-destructive/30!"
        >
          <UiSelectValue :placeholder />
        </UiSelectTrigger>

        <FormAddon v-if="hasAddonEnd" :icon="iconRight" :text="addonTextRight" align="inline-end">
          <template v-if="$slots['addon-right']" #default>
            <slot name="addon-right" />
          </template>
        </FormAddon>
      </UiInputGroup>

      <UiSelectContent>
        <slot :options="normalizedOptions">
          <UiSelectItem
            v-for="option in normalizedOptions"
            :key="option.value"
            v-bind="option"
          >
            {{ option.label }}
          </UiSelectItem>
        </slot>
      </UiSelectContent>
    </UiSelect>
  </FormField>
</template>
