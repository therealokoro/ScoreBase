<script lang="ts" setup>
import type { AcceptableValue } from "reka-ui"

defineProps<{ options: { id: string; name: string }[] }>()

const { value, errorMessage, handleChange } = useField<AcceptableValue[]>("subjects")
</script>

<template>
  <div class="w-full space-y-4">
    <div class="space-y-2">
      <UiLabel>Subjects</UiLabel>
      <p class="text-xs text-muted-foreground">
        Select a minimum of one subject to be added to the list
      </p>
      <p class="text-xs text-destructive" v-if="errorMessage">{{ errorMessage }}</p>
    </div>

    <UiCheckboxGroup
      :default-value="value"
      @update:model-value="handleChange"
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
  </div>
</template>
