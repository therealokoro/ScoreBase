<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import { InputGroup } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import FormField from './FormField.vue'
import FormAddon from './FormAddon.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  addOnKeys?: string[]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validateOnMount: false,
  addOnKeys: () => ['Enter', ','],
})

const model = defineModel<string[]>({ default: () => [] })

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
    <InputGroup>
      <FormAddon v-if="hasAddonStart" :icon :text="addonText">
        <template v-if="$slots['addon']" #default>
          <slot name="addon" />
        </template>
      </FormAddon>

      <TagsInput
        v-model="model"
        :add-on-keys="addOnKeys"
        :disabled
        :aria-invalid="isInvalid || undefined"
        :aria-describedby="description ? `${inputId}-desc` : undefined"
        data-slot="input-group-control"
        :class="cn(
          'flex-1 rounded-none border-0 shadow-none ring-0 focus-within:ring-0',
          isInvalid && 'border-destructive! focus-within:ring-destructive/30!',
        )"
      >
        <TagsInputItem v-for="tag in model" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>

        <TagsInputInput
          :id="inputId"
          :placeholder
          :disabled
          @blur="field.handleBlur()"
        />
      </TagsInput>

      <FormAddon v-if="hasAddonEnd" :icon="iconRight" :text="addonTextRight" align="inline-end">
        <template v-if="$slots['addon-right']" #default>
          <slot name="addon-right" />
        </template>
      </FormAddon>
    </InputGroup>
  </FormField>
</template>
