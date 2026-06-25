<script lang="ts" setup>
import type { VariantProps } from "tailwind-variants"
import { normalizeClass, type HTMLAttributes } from "vue"

const styles = tv({
  base: "grid gap-4",
  variants: {
    count: {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    }
  }
})

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    skeletonClasses?: HTMLAttributes["class"]
    count?: VariantProps<typeof styles>["count"]
  }>(),
  {
    count: 3
  }
)

const skeletonStyles = tv({ base: "h-20" })
</script>

<template>
  <div :class="styles({ class: normalizeClass(props.class) || undefined, count: props.count })">
    <UiSkeleton
      v-for="i in count"
      :key="i"
      :class="skeletonStyles({ class: normalizeClass(props.skeletonClasses) || undefined })"
    />
  </div>
</template>
