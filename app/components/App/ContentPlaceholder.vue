<script lang="ts" setup>
import { normalizeClass } from "vue"
import { ICONS } from "~~/shared/constants/icons"
const props = defineProps<{ title?: string; text: string; class?: string }>()

const styles = tv({
  base: "text-center w-full min-h-50 rounded-lg border-dashed border-2 flex-center flex-col gap-4"
})
</script>

<template>
  <div :class="styles({ class: normalizeClass(props.class) || undefined })">
    <Icon :name="ICONS.empty" class="size-10 text-muted-foreground" />
    <h3 class="font-semibold text-lg text-muted-foreground">{{ title }}</h3>
    <p class="max-w-md text-sm text-muted-foreground">{{ text }}</p>
  </div>
</template>
