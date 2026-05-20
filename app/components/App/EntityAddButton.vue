<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

defineProps<{ text: string }>()
</script>

<template>
  <UiCard class="border-dashed bg-muted" clickable>
    <div class="flex items-center justify-center h-full gap-2">
      <Icon :name="ICONS.add" />
      <p class="text-sm">{{ text }}</p>
    </div>
  </UiCard>
</template>
