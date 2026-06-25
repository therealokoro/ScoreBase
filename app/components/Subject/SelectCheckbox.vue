<script lang="ts" setup>
import type { FormKitFrameworkContext } from "@formkit/core"

const props = defineProps<{ context: FormKitFrameworkContext }>()
const options = computed(() => props.context.subjects as { id: string; name: string }[])
</script>

<template>
  <UiCheckboxGroup
    :default-value="context.value"
    @update:model-value="context.node.input"
    class="w-full flex flex-wrap gap-3"
  >
    <label
      :class="[
        'w-max px-2 py-1 rounded-lg border border-input text-xs cursor-pointer',
        'has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground',
        'transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px]'
      ]"
      v-for="item in options"
      :key="item.id"
    >
      <UiCheckbox :id="item.id" :value="item" class="sr-only after:absolute after:inset-0" />
      <span>{{ item.name }}</span>
    </label>
  </UiCheckboxGroup>
</template>
