<script lang="ts" setup>
/** Compact select used across the builder controls so every dropdown matches. */
withDefaults(
  defineProps<{
    options: { label: string; value: string }[]
    placeholder?: string
  }>(),
  { placeholder: "Choose" }
)

const model = defineModel<string>({ required: true })
</script>

<template>
  <UiSelect v-model="model" :placeholder="placeholder">
    <UiSelectTrigger class="h-8 w-full text-xs">
      <UiSelectValue :placeholder="placeholder" />
    </UiSelectTrigger>
    <UiSelectContent>
      <UiSelectItem
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="text-xs"
      >
        {{ option.label }}
      </UiSelectItem>
    </UiSelectContent>
  </UiSelect>
</template>
