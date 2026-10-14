<script lang="ts" setup>
/**
 * A scores-table heading. The column's maximum always renders on its own line under the label, so
 * every head lines up and the brackets can be switched off for all of them at once via
 * `ScoresConfig.showScoreMax`.
 */
defineProps<{
  label: string
  max?: string | null
  showMax: boolean
}>()
</script>

<template>
  <span class="block">{{ label }}</span>
  <span v-if="showMax && max" class="block text-[0.9em]">({{ max }})</span>
</template>
