<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { GradingKeyConfig } from "~~/shared/constants/report-card"

const config = defineModel<GradingKeyConfig>({ required: true })
</script>

<template>
  <div class="space-y-5">
    <ReportCardBuilderStyledTextInput v-model="config.title" label="Title" />

    <p class="bg-muted text-muted-foreground flex gap-2 rounded p-3 text-xs">
      <Icon :name="ICONS.info" class="mt-0.5 size-3.5 shrink-0" />
      <span>Grade data is pulled from result settings automatically.</span>
    </p>
  </div>
</template>
