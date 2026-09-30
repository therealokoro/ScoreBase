<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"

defineProps<{
  config: unknown
  data?: ReportCardData | null
}>()
</script>

<template>
  <div
    class="border-border rounded-lg border border-dashed p-4 text-sm"
    data-block-type="grading-key"
  >
    <p class="font-medium">Grading Key</p>
    <p class="text-muted-foreground">[Not yet implemented]</p>
  </div>
</template>
