<script lang="ts">
import { tv } from "tailwind-variants"

export const cardStyles = tv({
  base: "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-4",
  variants: {
    clickable: {
      true: [
        "cursor-pointer transition-colors",
        "hover:bg-card/80 hover:border-border/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
      ]
    }
  }
})
</script>

<script lang="ts" setup>
import { Primitive } from "reka-ui"
import type { PrimitiveProps } from "reka-ui"
import { normalizeClass, computed, resolveComponent } from "vue"
import type { HTMLAttributes } from "vue"

import type { NuxtLinkProps } from "#app"

const props = withDefaults(
  defineProps<
    NuxtLinkProps &
      PrimitiveProps & {
        /** Title displayed via CardTitle. */
        title?: string
        /** Description displayed via CardDescription. */
        description?: string
        /** Plain-text content displayed via CardContent. Avoid passing raw HTML. */
        content?: string
        /** Custom class(es) to add to the element. */
        class?: HTMLAttributes["class"]
        clickable?: boolean
      }
  >(),
  { as: "div" }
)

const isClickable = computed(() => props.clickable || !!(props.to || props.href))

const elementType = computed(() => {
  if (props.as && props.as !== "div") return props.as
  if (isClickable.value) return resolveComponent("NuxtLink")
  return "div"
})
</script>

<template>
  <Primitive
    data-slot="card"
    :as="elementType"
    :as-child="asChild"
    :to="to"
    :href="href"
    :target="target"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    :tabindex="isClickable ? 0 : undefined"
    :role="isClickable ? 'link' : undefined"
    :class="
      cardStyles({
        clickable: isClickable,
        class: normalizeClass(props.class) || undefined
      })
    "
  >
    <slot>
      <slot name="header">
        <UiCardHeader>
          <UiCardTitle v-if="title || $slots.title" :title="title">
            <slot name="title" />
          </UiCardTitle>
          <slot name="action" />
          <UiCardDescription v-if="description || $slots.description" :description="description">
            <slot name="description" />
          </UiCardDescription>
        </UiCardHeader>
      </slot>

      <UiCardContent v-if="content || $slots.content">
        <!-- Use text node instead of v-html to prevent XSS -->
        <slot name="content">{{ content }}</slot>
      </UiCardContent>

      <slot name="footer" />
    </slot>
  </Primitive>
</template>
