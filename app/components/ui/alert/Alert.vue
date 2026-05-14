<script setup lang="ts">
import type { HTMLAttributes } from "vue"

import { cn } from "@/lib/utils"

import type { AlertVariants } from "."
import { alertVariants, AlertTitle, AlertDescription } from "."

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: AlertVariants["variant"]
  icon?: string
  title?: string
  description: string
}>()
</script>

<template>
  <div data-slot="alert" :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot>
      <Icon mode="svg" v-if="icon" data-slot="alert-icon" :name="icon" />
      <AlertTitle v-if="title">{{ title }}</AlertTitle>
      <AlertDescription v-if="description">{{ description }}</AlertDescription>
      <slot name="action" />
    </slot>
  </div>
</template>
