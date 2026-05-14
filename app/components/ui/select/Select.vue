<script setup lang="ts">
import { computed } from 'vue'
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
import { SelectRoot, useForwardPropsEmits } from 'reka-ui'

import { SelectContent, SelectTrigger, SelectItem, SelectValue } from '.'

export interface SelectOption {
  label: string
  value: string
  [key: string]: unknown
}

export type SelectOptionRaw = string | SelectOption

interface Props extends SelectRootProps {
  placeholder?: string
  options?: SelectOptionRaw[]
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
})

const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

// ─── Normalize options ────────────────────────────────────────────────────────

const normalizedOptions = computed<SelectOption[]>(() =>
  props.options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  ),
)
</script>

<template>
  <SelectRoot
    v-slot="slotProps"
    data-slot="select"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" :options="normalizedOptions">
       <SelectTrigger class="w-full">
        <SelectValue :placeholder />
      </SelectTrigger>

      <SelectContent>
        <SelectItem
          v-for="option in normalizedOptions"
          :key="option.value"
          v-bind="option"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </slot>
  </SelectRoot>
</template>