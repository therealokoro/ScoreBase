<script setup lang="ts">
interface Props {
  icon?: string
  text?: string
  align?: "inline-start" | "inline-end"
}

defineProps<Props>()
</script>

<template>
  <UiInputGroupAddon :align>
    <slot>
      <UiInputGroupText v-if="text">{{ text }}</UiInputGroupText>
      <Icon v-else-if="icon" :name="icon" class="size-4 text-muted-foreground" />
    </slot>
  </UiInputGroupAddon>
</template>
