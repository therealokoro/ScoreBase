<template>
  <Primitive
    :as="hTag"
    v-bind="forwarded"
    :class="headingStyles({ level, class: normalizeClass(props.class) || undefined })"
  >
    <slot />
  </Primitive>
</template>

<script lang="ts">
import { Primitive } from "reka-ui"
import type { PrimitiveProps } from "reka-ui"
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

/** Styles for the heading component. */
export const headingStyles = tv({
  base: "text-foreground font-sans",
  variants: {
    level: {
      1: "text-xl font-semibold sm:text-2xl",
      2: "text-lg font-semibold sm:text-xl",
      3: "text-base font-semibold sm:text-lg",
      4: "text-base font-semibold",
      5: "text-base font-semibold",
      6: "text-base"
    }
  },
  defaultVariants: {
    level: 1
  }
})

/** Props for the heading component. */
export type HeadingProps = Omit<PrimitiveProps, "as"> & {
  /**
   * The heading level to use, which will determine the HTML tag used.
   *
   * @default 1
   */
  level?: VariantProps<typeof headingStyles>["level"]
  /** Custom class(es) to apply to the heading element. */
  class?: HTMLAttributes["class"]
}
</script>

<script lang="ts" setup>
const props = withDefaults(defineProps<HeadingProps>(), { level: 1 })
// The element to use
const hTag = `h${props.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
const forwarded = reactiveOmit(props, ["class"])
</script>
