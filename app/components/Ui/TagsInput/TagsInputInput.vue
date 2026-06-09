<template>
  <TagsInputInput
    v-bind="forwarded"
    data-slot="tags-input-input"
    :class="styles({ class: normalizeClass(props.class) || undefined })"
  >
    <slot />
  </TagsInputInput>
</template>

<script lang="ts" setup>
import { TagsInputInput } from "reka-ui"
import type { TagsInputInputProps } from "reka-ui"
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

const props = defineProps<TagsInputInputProps & { class?: HTMLAttributes["class"] }>()
const forwarded = reactiveOmit(props, "class")
const styles = tv({
  base: "dark:bg-input/30 h-9 w-full bg-transparent text-sm focus:outline-none"
})
</script>
