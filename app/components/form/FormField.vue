<script setup lang="ts">
import { computed, useId, useSlots } from "vue"

const props = defineProps<{
  label?: string
  description?: string
  error?: string
  class?: string
  icon?: string
  iconRight?: string
  addonText?: string
  addonTextRight?: string
}>()

const id = useId()
const slots = useSlots()
const isInvalid = computed(() => !!props.error)
const hasAddonStart = computed(() => !!props.icon || !!props.addonText)
const hasAddonEnd = computed(
  () => !!props.iconRight || !!props.addonTextRight || slots["addon-right"]
)

defineExpose({ id })
</script>

<template>
  <UiField :class :data-invalid="isInvalid || undefined" class="flex flex-col gap-1.5 w-full">
    <!-- Input Label -->
    <UiFieldLabel v-if="label" :for="id">{{ label }}</UiFieldLabel>

    <!-- Start Input Addon -->
    <UiInputGroup>
      <UiInputGroupAddon v-if="hasAddonStart">
        <slot name="addon">
          <UiInputGroupText v-if="addonText">{{ addonText }}</UiInputGroupText>
          <Icon v-else-if="icon" :name="icon" class="size-4 text-muted-foreground" />
        </slot>
      </UiInputGroupAddon>

      <!-- Input Slot -->
      <slot :id :is-invalid="isInvalid" />

      <!-- End Input Addon -->
      <UiInputGroupAddon v-if="hasAddonEnd" align="inline-end">
        <slot name="addon-right">
          <UiInputGroupText v-if="addonTextRight">{{ addonTextRight }}</UiInputGroupText>
          <Icon v-else-if="iconRight" :name="iconRight" class="size-4 text-muted-foreground" />
        </slot>
      </UiInputGroupAddon>
    </UiInputGroup>

    <!-- Input Description -->
    <UiFieldDescription v-if="description && !isInvalid" :id="`${id}-desc`">
      {{ description }}
    </UiFieldDescription>

    <!-- Input Error -->
    <UiFieldError v-if="isInvalid">{{ error }}</UiFieldError>
  </UiField>
</template>
