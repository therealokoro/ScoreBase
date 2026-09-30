<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { RemarksConfig } from "~~/shared/constants/report-card"

import { resolveView } from "./placeholder"
import { textStyle } from "./text"

const props = defineProps<{
  config: RemarksConfig
  data?: ReportCardData | null
  blockId?: string
}>()

function assetUrl(pathname: string | null): string | undefined {
  return pathname ? `/images/${pathname}` : undefined
}

function comment(role: "teacher" | "principal"): string {
  // TODO Phase 11: read from manualValues — data.manualValues?.[blockId]?.[role]
  const view = resolveView(props.data)
  const fallback = role === "teacher" ? view.teacherRemark : view.principalRemark
  return fallback || "—"
}
</script>

<template>
  <div data-block-type="remarks" class="grid gap-6 sm:grid-cols-2">
    <div v-if="config.teacher.visible" class="space-y-1">
      <p :style="textStyle(config.teacher.label.style)">{{ config.teacher.label.value }}</p>
      <p v-if="config.teacher.showComment" class="min-h-8 text-sm font-medium">
        {{ comment("teacher") }}
      </p>
      <template v-if="config.teacher.showSignature">
        <img
          v-if="config.teacher.signatureMode === 'image' && config.teacher.signatureImage"
          :src="assetUrl(config.teacher.signatureImage)"
          alt="Teacher signature"
          class="h-10 object-contain"
        />
        <div v-else class="border-foreground mt-6 mb-1 w-40 border-b" />
        <p
          class="text-muted-foreground text-xs"
          :style="textStyle(config.teacher.signatureLabel.style)"
        >
          {{ config.teacher.signatureLabel.value }}
        </p>
      </template>
    </div>

    <div v-if="config.principal.visible" class="space-y-1">
      <p :style="textStyle(config.principal.label.style)">{{ config.principal.label.value }}</p>
      <p v-if="config.principal.showComment" class="min-h-8 text-sm font-medium">
        {{ comment("principal") }}
      </p>
      <template v-if="config.principal.showSignature">
        <img
          v-if="config.principal.signatureMode === 'image' && config.principal.signatureImage"
          :src="assetUrl(config.principal.signatureImage)"
          alt="Principal signature"
          class="h-10 object-contain"
        />
        <div v-else class="border-foreground mt-6 mb-1 w-40 border-b" />
        <p
          class="text-muted-foreground text-xs"
          :style="textStyle(config.principal.signatureLabel.style)"
        >
          {{ config.principal.signatureLabel.value }}
        </p>
      </template>
    </div>
  </div>
</template>
