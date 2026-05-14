<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import type { PrimitiveProps } from "reka-ui"
import { useForwardProps } from "reka-ui"
import type { HTMLAttributes } from "vue"

import type { NuxtLinkProps } from "#app"
import { cn } from "@/lib/utils"

import type { ButtonVariants } from "."
import { buttonVariants } from "."

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  as?: any
  text?: string
  icon?: string
  iconRight?: string
  loading?: boolean
  loadingIcon?: string
}

const props = withDefaults(defineProps<Props & NuxtLinkProps>(), {
  loadingIcon: "lucide:loader-circle"
})

const elementType = computed(() => {
  if (props.as) return props.as
  if (props.href || props.to || props.target) return resolveComponent("NuxtLink")
  return "button"
})

const isIconOnly = computed(
  () => props.icon && !props.iconRight && !props.text && !useSlots().default
)

const forwarded = useForwardProps(
  reactiveOmit(
    props,
    "class",
    "text",
    "icon",
    "iconRight",
    "size",
    "variant",
    "as",
    "loading",
    "loadingIcon"
  )
)
</script>

<template>
  <component
    data-slot="button"
    v-bind="forwarded"
    :data-variant="variant"
    :data-size="size"
    :is="elementType"
    :as-child="asChild"
    :class="
      cn(buttonVariants({ variant, size: isIconOnly ? (size ?? 'icon') : size }), props.class)
    "
  >
    <template v-if="icon">
      <Icon :name="loading ? loadingIcon : icon" :class="loading && 'animate-spin'" />
    </template>

    <slot>{{ text }}</slot>

    <template v-if="iconRight">
      <Icon :name="loading && !icon ? loadingIcon : iconRight" :class="loading && 'animate-spin'" />
    </template>
  </component>
</template>
