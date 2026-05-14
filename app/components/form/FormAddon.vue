<script setup lang="ts">
import { InputGroupAddon, InputGroupText } from '@/components/ui/input-group'

interface Props {
  icon?: string
  text?: string
  align?: 'inline-start' | 'inline-end'
}

defineProps<Props>()
</script>

<template>
  <InputGroupAddon :align>
    <slot>
      <InputGroupText v-if="text">{{ text }}</InputGroupText>
      <Icon v-else-if="icon" :name="icon" class="size-4 text-muted-foreground" />
    </slot>
  </InputGroupAddon>
</template>
