<script lang="ts">
import { tv, type VariantProps } from "tailwind-variants"

export const buttonStyles = tv({
  base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent bg-clip-padding text-sm font-medium rounded-(--radius) focus-visible:ring-1 aria-invalid:ring-1 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*=size-])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
      outline:
        "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
      ghost:
        "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
      destructive:
        "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
      link: "text-primary underline-offset-4 hover:underline"
    },
    size: {
      xs: "h-6 gap-1 px-1.5 text-[11px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=size-])]:size-2.5",
      sm: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*=size-])]:size-3",
      md: "h-8 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*=size-])]:size-3.5",
      lg: "h-10 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*=size-])]:size-4",
      icon: "size-8 [&_svg:not([class*=size-])]:size-3.5",
      "icon-xs": "size-6 [&_svg:not([class*=size-])]:size-2.5",
      "icon-sm": "size-7 [&_svg:not([class*=size-])]:size-3",
      "icon-lg": "size-10 [&_svg:not([class*=size-])]:size-4"
    },
    block: {
      true: "w-full"
    },
    disabled: {
      true: "pointer-events-none opacity-50"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md"
  }
})

export type ButtonVariants = VariantProps<typeof buttonStyles>
</script>

<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core"
import type { Component } from "vue"
import type { PrimitiveProps } from "reka-ui"
import { useForwardProps } from "reka-ui"
import { normalizeClass, type HTMLAttributes } from "vue"

import type { NuxtLinkProps } from "#app"

interface ButtonProps extends PrimitiveProps, NuxtLinkProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  as?: string | Component
  text?: string
  icon?: string
  iconRight?: string
  loading?: boolean
  block?: boolean
  disabled?: boolean
  label?: string
  loadingIcon?: string
  type?: "button" | "submit" | "reset"
}

const props = withDefaults(defineProps<ButtonProps>(), {
  loadingIcon: "lucide:loader-circle"
})

const slots = useSlots()

const isLinkElement = computed(
  () => !!(props.href || props.to || props.target)
)

const elementType = computed(() => {
  if (props.as) return props.as
  if (isLinkElement.value) return resolveComponent("NuxtLink")
  return "button"
})

const isIconOnly = computed(
  () => !props.text && !slots.default && (!!props.icon || !!props.iconRight) && !(props.icon && props.iconRight)
)

// Spinner is shown inline when loading with no leading icon
const showInlineSpinner = computed(
  () => props.loading && !props.icon
)

// iconRight shows the spinner only when icon is not already handling it
const iconRightName = computed(() => {
  if (props.loading && !props.icon) return props.loadingIcon
  return props.iconRight
})

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
    "loadingIcon",
    "label",
    "block",
    // Don't forward disabled natively to link elements; use aria-disabled instead
    ...(isLinkElement.value ? ["disabled"] as const : [])
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
    :data-icon="icon ? 'inline-start' : iconRight ? 'inline-end' : ''"
    :aria-label="isIconOnly ? label : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-disabled="isLinkElement && disabled ? 'true' : undefined"
    :class="
      buttonStyles({
        class: normalizeClass(props.class) || undefined,
        variant,
        disabled,
        block,
        size: isIconOnly ? (size ?? 'icon') : size
      })
    "
  >
    <!-- Leading icon or loading spinner (when no leading icon) -->
    <template v-if="icon">
      <Icon
        :name="loading ? loadingIcon : icon"
        :class="loading && 'animate-spin'"
        aria-hidden="true"
      />
    </template>
    <template v-else-if="showInlineSpinner">
      <Icon
        :name="loadingIcon"
        class="animate-spin"
        aria-hidden="true"
      />
    </template>

    <slot>{{ text }}</slot>

    <!-- Screen-reader loading announcement -->
    <span v-if="loading" class="sr-only">Loading</span>

    <!-- Trailing icon -->
    <template v-if="iconRight && iconRightName">
      <Icon
        :name="iconRightName"
        :class="loading && !icon ? 'animate-spin' : undefined"
        aria-hidden="true"
      />
    </template>
  </component>
</template>