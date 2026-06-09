<script lang="ts" setup>
const props = defineProps<{ context: any }>()

function handleInput(value: any) {
  props.context.node.input(value)
}

function handleOpenChange(open: boolean) {
  if (!open) props.context.handlers.blur()
}

const isInvalid = computed(
  () => props.context.state.validationVisible && !props.context.state.valid
)
</script>

<template>
  <UiSelect
    :options="context.options"
    :placeholder="context.placeholder"
    :multiple="context.multiple"
    :disabled="context.disabled"
    :value="context.value"
    :id="context.id"
    @update:model-value="handleInput"
    @update:open="handleOpenChange"
  >
    <template #default="{ options }">
      <UiSelectTrigger :aria-invalid="isInvalid || undefined" class="w-full">
        <UiSelectValue :placeholder="context.placeholder" />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem v-for="option in options" :key="option.value" v-bind="option">
          {{ option.label }}
        </UiSelectItem>
      </UiSelectContent>
    </template>
  </UiSelect>
</template>
