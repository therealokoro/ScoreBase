<script lang="ts">
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
</script>

<script lang="ts" setup>
import { SelectRoot, useForwardPropsEmits } from "reka-ui"
import type { SelectRootEmits, SelectRootProps } from "reka-ui"

const props = withDefaults(defineProps<SelectRootProps & Props>(), {
  options: () => []
})

const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const normalizedOptions = computed<SelectOption[]>(() =>
  props.options.map((opt) => (typeof opt === "string" ? { label: opt, value: opt } : opt))
)
</script>

<template>
  <SelectRoot v-slot="slotProps" data-slot="select" v-bind="forwarded">
    <slot v-bind="slotProps" :options="normalizedOptions">
      <UiSelectTrigger class="w-full">
        <UiSelectValue :placeholder />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem v-for="option in normalizedOptions" :key="option.value" v-bind="option">
          {{ option.label }}
        </UiSelectItem>
      </UiSelectContent>
    </slot>
  </SelectRoot>
</template>
