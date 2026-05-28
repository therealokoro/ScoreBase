<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
defineEmits(["edit", "delete"])
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton size="icon" variant="ghost" aria-label="Open action menu" title="Open action menu">
        <Icon name="lucide:ellipsis" class="size-4" aria-hidden="true" />
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent align="end">
      <UiDropdownMenuItem class="text-xs" title="Edit" @click="$emit('edit')" :icon="ICONS.edit" />
      <UiDropdownMenuItem
        class="text-xs"
        title="Delete"
        :icon="ICONS.delete"
        variant="destructive"
        @click="$emit('delete')"
      />
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
