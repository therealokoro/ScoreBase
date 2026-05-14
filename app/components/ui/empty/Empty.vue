<script setup lang="ts">
import type { HTMLAttributes } from "vue"

import { cn } from "@/lib/utils"

import { EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "."

const props = defineProps<{
  class?: HTMLAttributes["class"]
  title?: string
  description?: string
  icon?: string
  noIcon?: boolean
}>()
</script>

<template>
  <div
    data-slot="empty"
    :class="
      cn(
        'gap-4 rounded-none border-dashed p-6 flex w-full min-w-0 flex-1 flex-col items-center justify-center text-center text-balance',
        props.class
      )
    "
  >
    <slot>
      <EmptyHeader>
        <slot name="media">
          <EmptyMedia v-if="!noIcon" variant="icon">
            <Icon :name="icon ? icon : 'lucide:folder'" />
          </EmptyMedia>
        </slot>

        <template v-if="title">
          <EmptyTitle>{{ title }}</EmptyTitle>
        </template>

        <template v-if="description">
          <EmptyDescription>
            {{ description }}
          </EmptyDescription>
        </template>
      </EmptyHeader>

      <slot name="content" />
    </slot>
  </div>
</template>
