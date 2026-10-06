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
  <div data-block-type="remarks" class="grid gap-4 sm:grid-cols-2">
    <div v-if="config.teacher.visible" class="space-y-1">
      <div :class="config.teacher.commentLabelPlacement === 'side' ? 'flex items-baseline gap-2' : ''">
        <p :style="textStyle(config.teacher.label.style)">{{ config.teacher.label.value }}</p>
        <p class="min-h-5 text-[11px] font-medium">{{ comment("teacher") }}</p>
      </div>
      <template v-if="config.teacher.showSignature">
        <img
          v-if="config.teacher.signatureMode === 'image' && config.teacher.signatureImage"
          :src="assetUrl(config.teacher.signatureImage)"
          alt="Teacher signature"
          class="h-8 object-contain"
        />
        <div v-else class="border-foreground mt-5 mb-1 w-40 border-b" />
        <p
          class="text-muted-foreground text-[10px]"
          :style="textStyle(config.teacher.signatureLabel.style)"
        >
          {{ config.teacher.signatureLabel.value }}
        </p>
      </template>
    </div>

    <div v-if="config.principal.visible" class="space-y-1">
      <div
        :class="config.principal.commentLabelPlacement === 'side' ? 'flex items-baseline gap-2' : ''"
      >
        <p :style="textStyle(config.principal.label.style)">{{ config.principal.label.value }}</p>
        <p class="min-h-5 text-[11px] font-medium">{{ comment("principal") }}</p>
      </div>
      <template v-if="config.principal.showSignature">
        <img
          v-if="config.principal.signatureMode === 'image' && config.principal.signatureImage"
          :src="assetUrl(config.principal.signatureImage)"
          alt="Principal signature"
          class="h-8 object-contain"
        />
        <div v-else class="border-foreground mt-5 mb-1 w-40 border-b" />
        <p
          class="text-muted-foreground text-[10px]"
          :style="textStyle(config.principal.signatureLabel.style)"
        >
          {{ config.principal.signatureLabel.value }}
        </p>
      </template>
    </div>
  </div>
</template>
