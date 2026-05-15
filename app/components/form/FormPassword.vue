<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import FormField from './FormField.vue'
import FormAddon from './FormAddon.vue'

interface Props {
  name?: string
  validateOnMount?: boolean
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  icon?: string
  addonText?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  validateOnMount: false,
})

const model = defineModel<string>()

const slots = useSlots()
const hasAddonStart = computed(() => !!slots['addon'] || !!props.icon || !!props.addonText)

const visible     = ref(false)
const inputType   = computed(() => visible.value ? 'text' : 'password')
const toggleIcon  = computed(() => visible.value ? 'lucide:eye-off' : 'lucide:eye')
const toggleLabel = computed(() => visible.value ? 'Hide password' : 'Show password')
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
    <UiInputGroup>
      <FormAddon v-if="hasAddonStart" :icon :text="addonText">
        <template v-if="$slots['addon']" #default>
          <slot name="addon" />
        </template>
      </FormAddon>

      <UiInputGroupInput
        :id="inputId"
        :type="inputType"
        :placeholder
        :disabled
        :readonly
        v-model="model"
        :aria-describedby="description ? `${inputId}-desc` : undefined"
        :aria-invalid="isInvalid || undefined"
        class="aria-invalid:border-destructive! aria-invalid:ring-destructive/20! aria-invalid:focus-visible:ring-destructive/30!"
        @blur="field.handleBlur"
      />

      <UiInputGroupAddon align="inline-end">
        <slot name="addon-right">
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
        </slot>
      </UiInputGroupAddon>
    </UiInputGroup>
  </FormField>
</template>
