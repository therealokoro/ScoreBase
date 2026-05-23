<script lang="ts" setup>
import { Primitive } from "reka-ui"
import type { PrimitiveProps } from "reka-ui"
import type { VariantProps } from "tailwind-variants"
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

type Props = PrimitiveProps & {
  /** Custom class(es) to add to parent element. */
  class?: HTMLAttributes["class"]
  /** Whether the skeleton is loading. */
  loading?: boolean
  /** Shimmer intensity. */
  shimmer?: VariantProps<typeof styles>["shimmer"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "div",
  shimmer: "strong",
  loading: true
})

const forwarded = reactiveOmit(props, "class", "loading", "shimmer")

const styles = tv({
  base: ["rounded-md", "relative overflow-hidden", "bg-muted"],
  variants: {
    loading: {
      true: [
        "cursor-wait",
        "before:absolute before:inset-0",
        "before:bg-linear-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        "before:-translate-x-full"
      ],
      false: "cursor-default opacity-60"
    },
    shimmer: {
      subtle: "before:via-white/5",
      default: "before:via-white/10",
      strong: "before:via-white/20"
    }
  },
  defaultVariants: {
    shimmer: "default"
  }
})
</script>

<template>
  <Primitive
    data-slot="skeleton"
    :class="styles({ loading, shimmer, class: normalizeClass(props.class) || undefined })"
    v-bind="forwarded"
  >
    <slot />
  </Primitive>
</template>
