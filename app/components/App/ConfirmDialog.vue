<script lang="ts" setup>
defineProps<{ title: string; description?: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const isOpen = ref(false)
</script>

<template>
  <UiAlertDialog v-model:open="isOpen">
    <!-- Dialog Trigger -->
    <UiAlertDialogTrigger as-child>
      <slot />
    </UiAlertDialogTrigger>

    <UiAlertDialogContent @escape-key-down="emit('cancel')">
      <!-- Dialog Header -->
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>{{ title }}</UiAlertDialogTitle>
        <UiAlertDialogDescription v-if="description">
          {{ description }}
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>

      <!-- Dialog Footer -->
      <UiAlertDialogFooter>
        <slot name="actions">
          <UiAlertDialogCancel @click="emit('cancel')" />
          <UiAlertDialogAction @click="emit('confirm')" />
        </slot>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
