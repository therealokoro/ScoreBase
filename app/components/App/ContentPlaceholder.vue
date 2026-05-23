<script lang="ts" setup>
import { normalizeClass } from "vue"
import { ICONS } from "~~/shared/constants/icons"
const props = defineProps<{ text: string; class?: string }>()

const styles = tv({
  base: "w-full min-h-50 rounded-lg border-dashed border-2 flex-center flex-col gap-4"
})
</script>

<template>
  <div :class="styles({ class: normalizeClass(props.class) || undefined })">
    <Icon :name="ICONS.empty" class="size-10 text-muted-foreground" />
    <p class="text-sm text-muted-foreground">{{ text }}</p>
  </div>
</template>
