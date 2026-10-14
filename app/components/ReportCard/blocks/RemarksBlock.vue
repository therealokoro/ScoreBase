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

function comment(role: "teacher" | "director"): string {
  // TODO Phase 11: read from manualValues — data.manualValues?.[blockId]?.[role]
  const view = resolveView(props.data)
  return (role === "teacher" ? view.teacherRemark : view.principalRemark) || "—"
}
</script>

<template>
  <div data-block-type="remarks" class="space-y-3">
    <!--
      One block, two signature rows. The class teacher's row puts the signature at the far left and
      the comment at the far right of the same line; the label already ends in a colon, so the
      comment follows it after a single space. The head signature (principal/director) sits below,
      right-aligned.
    -->
    <div v-if="config.teacher.visible" class="flex items-end justify-between gap-4">
      <div v-if="config.teacher.showSignature" class="space-y-0.5">
        <img
          v-if="config.teacher.signatureMode === 'image' && config.teacher.signatureImage"
          :src="assetUrl(config.teacher.signatureImage)"
          alt="Teacher signature"
          class="h-8 object-contain"
        />
        <div v-else class="flex items-end gap-2">
          <p
            class="text-muted-foreground text-[10px]"
            :style="textStyle(config.teacher.signatureLabel.style)"
          >
            {{ config.teacher.signatureLabel.value }}
          </p>
          <div class="border-foreground mb-1 w-36 border-b" />
        </div>
      </div>

      <p class="min-w-0 flex-1 text-right">
        <span :style="textStyle(config.teacher.label.style)">{{ config.teacher.label.value }}</span
        >{{ " " }}<span class="text-[11px] font-medium">{{ comment("teacher") }}</span>
      </p>
    </div>

    <!-- Head signature: the same person whether the school calls them principal or director. -->
    <div v-if="config.director.visible" class="flex justify-end">
      <div
        v-if="config.director.signatureMode === 'image' && config.director.signatureImage"
        class="space-y-0.5 text-right"
      >
        <img
          :src="assetUrl(config.director.signatureImage)"
          alt="Head signature"
          class="ml-auto h-8 object-contain"
        />
        <p
          class="text-muted-foreground text-[10px]"
          :style="textStyle(config.director.signatureLabel.style)"
        >
          {{ config.director.signatureLabel.value }}
        </p>
      </div>
      <div v-else class="flex items-end gap-2">
        <p
          class="text-muted-foreground text-[10px]"
          :style="textStyle(config.director.signatureLabel.style)"
        >
          {{ config.director.signatureLabel.value }}
        </p>
        <div class="border-foreground mb-1 w-36 border-b" />
      </div>
    </div>
  </div>
</template>
