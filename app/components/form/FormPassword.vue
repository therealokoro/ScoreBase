<script setup lang="ts">
import { computed, ref, useSlots } from "vue"

interface Props {
  name: string
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  validateOnMount?: boolean
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
  class?: string
}

const props = defineProps<Props>()

const { value, errorMessage, handleBlur, handleChange } = useField<string>(
  () => props.name,
  undefined,
  { label: props.label, validateOnMount: props.validateOnMount }
)

const visible = ref(false)
const inputType = computed(() => (visible.value ? "text" : "password"))
const toggleIcon = computed(() => (visible.value ? "lucide:eye-off" : "lucide:eye"))
const toggleLabel = computed(() => (visible.value ? "Hide password" : "Show password"))
</script>

<template>
  <FormField
    :icon
    :label
    :class
    :icon-right
    :addon-text
    :description
    :addon-text-right
    :error="errorMessage"
  >
    <template #default="{ id, isInvalid }">
      <UiInputGroupInput
        :id="id"
        :type="inputType"
        :placeholder
        :disabled
        :readonly
        :value="value"
        @input="handleChange"
        @blur="handleBlur"
        :aria-describedby="description ? `${id}-desc` : undefined"
        :aria-invalid="isInvalid || undefined"
        class="aria-invalid:border-destructive! aria-invalid:ring-destructive/20! aria-invalid:focus-visible:ring-destructive/30!"
      />
    </template>

    <template #addon-right>
      <UiInputGroupButton
        type="button"
        variant="ghost"
        size="icon-xs"
        :aria-label="toggleLabel"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <Icon :name="toggleIcon" class="size-4 text-muted-foreground" />
      </UiInputGroupButton>
    </template>
  </FormField>
</template>
