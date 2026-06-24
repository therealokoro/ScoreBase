<script lang="ts" setup>
import { type ResultStatus } from "~~/shared/constants/extras"

const props = defineProps<{ status: ResultStatus }>()
// Status badge — color-coded, same mapping as the list table
// ---------------------------------------------------------------------------
const STATUS_BADGE_VARIANTS: Record<ResultStatus, any> = {
  draft: "gray",
  submitted: "warning",
  reviewed: "info",
  published: "success"
}

const statusVariant = computed(() => STATUS_BADGE_VARIANTS[props.status])
</script>

<template>
  <UiBadge :variant="statusVariant" class="w-fit">
    {{ capitalize(status) }}
  </UiBadge>
</template>
