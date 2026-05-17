<script lang="ts">
import { Primitive } from "reka-ui"
import type { PrimitiveProps } from "reka-ui"
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

export const emptyStyles = tv({
  base: "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12"
})

export type EmptyProps = PrimitiveProps & {
  /** Additional classes to apply to the empty state container. */
  class?: HTMLAttributes["class"]
  title?: string
  description?: string
  icon?: string
  noIcon?: boolean
}
</script>

<script lang="ts" setup>
const props = defineProps<EmptyProps>()
const forwarded = reactiveOmit(props, ["class", "title", "description", "icon", "noIcon"])
</script>

<template>
  <Primitive
    data-slot="empty"
    :class="emptyStyles({ class: normalizeClass(props.class) || undefined })"
    v-bind="forwarded"
  >
    <slot>
      <UiEmptyHeader>
        <!-- <slot name="media"> -->
        <UiEmptyMedia v-if="!noIcon" variant="icon">
          <Icon :name="icon ? icon : 'lucide:folder'" />
        </UiEmptyMedia>
        <!-- </slot> -->

        <template v-if="title">
          <UiEmptyTitle>{{ title }}</UiEmptyTitle>
        </template>

        <template v-if="description">
          <UiEmptyDescription>
            {{ description }}
          </UiEmptyDescription>
        </template>
      </UiEmptyHeader>

      <slot name="content" />
    </slot>
  </Primitive>
</template>
