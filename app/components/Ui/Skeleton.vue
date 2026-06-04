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
  base: ["rounded-md", "bg-size-[600px_100%]"],
  variants: {
    loading: {
      true: ["cursor-wait", "animate-shimmer"],
      false: ["cursor-default", "opacity-60", "bg-muted"]
    },
    shimmer: {
      subtle: [
        "bg-[linear-gradient(90deg,var(--color-muted)_25%,color-mix(in_oklch,var(--color-muted-foreground)_8%,transparent)_50%,var(--color-muted)_75%)]"
      ],
      default: [
        "bg-[linear-gradient(90deg,var(--color-muted)_25%,color-mix(in_oklch,var(--color-muted-foreground)_15%,transparent)_50%,var(--color-muted)_75%)]"
      ],
      strong: [
        "bg-[linear-gradient(90deg,var(--color-muted)_25%,color-mix(in_oklch,var(--color-muted-foreground)_25%,transparent)_50%,var(--color-muted)_75%)]"
      ]
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
