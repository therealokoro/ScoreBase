<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { SelectOptionRaw } from '@/components/ui/select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    <Select
      v-model="model"
      :options
      :disabled
      v-slot="{ options: normalizedOptions }"
      @update:open="(open) => !open && field.handleBlur()"
    >
      <InputGroup>
        <FormAddon v-if="hasAddonStart" :icon :text="addonText">
          <template v-if="$slots['addon']" #default>
            <slot name="addon" />
          </template>
        </FormAddon>

        <SelectTrigger
          data-slot="input-group-control"
          :aria-invalid="isInvalid || undefined"
          :class="cn(
            'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0',
            isInvalid && 'border-destructive! focus-visible:ring-destructive/30!',
          )"
        >
          <SelectValue :placeholder />
        </SelectTrigger>

        <FormAddon v-if="hasAddonEnd" :icon="iconRight" :text="addonTextRight" align="inline-end">
          <template v-if="$slots['addon-right']" #default>
            <slot name="addon-right" />
          </template>
        </FormAddon>
      </InputGroup>

      <SelectContent>
        <slot :options="normalizedOptions">
          <SelectItem
            v-for="option in normalizedOptions"
            :key="option.value"
            v-bind="option"
          >
            {{ option.label }}
          </SelectItem>
        </slot>
      </SelectContent>
    </Select>
  </FormField>
</template>
