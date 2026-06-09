<template>
  <TagsInputRoot
    v-slot="slotProps"
    data-slot="tags-input"
    v-bind="forwarded"
    :class="styles({ class: normalizeClass(props.class) || undefined })"
  >
    <slot v-bind="slotProps" />
  </TagsInputRoot>
</template>

<script lang="ts" setup>
import { TagsInputRoot, useForwardPropsEmits } from "reka-ui"
import type { TagsInputRootEmits, TagsInputRootProps } from "reka-ui"
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

const props = defineProps<TagsInputRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<TagsInputRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, "class"), emits)

const styles = tv({
  base: ["dark:bg-input/30 rounded-lg bg-transparent px-3 text-sm flex flex-col gap-1"]
})
</script>
