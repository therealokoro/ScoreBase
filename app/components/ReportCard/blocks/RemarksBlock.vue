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
  <div data-block-type="remarks" class="space-y-3">
    <div class="grid gap-4" :class="config.principal.visible ? 'sm:grid-cols-2' : ''">
      <!-- Teacher -->
      <div v-if="config.teacher.visible" class="space-y-1">
        <!-- Signature left, comment right -->
        <div
          v-if="config.teacher.layout === 'signature-comment'"
          class="flex items-end justify-between gap-4"
        >
          <div v-if="config.teacher.showSignature" class="space-y-0.5">
            <img
              v-if="config.teacher.signatureMode === 'image' && config.teacher.signatureImage"
              :src="assetUrl(config.teacher.signatureImage)"
              alt="Teacher signature"
              class="h-8 object-contain"
            />
            <div v-else class="border-foreground mt-5 mb-1 w-36 border-b" />
            <p
              class="text-muted-foreground text-[10px]"
              :style="textStyle(config.teacher.signatureLabel.style)"
            >
              {{ config.teacher.signatureLabel.value }}
            </p>
          </div>

          <div
            class="min-w-0 flex-1 text-right"
            :class="config.teacher.commentLabelPlacement === 'side' ? 'flex items-baseline justify-end gap-2' : ''"
          >
            <p :style="textStyle(config.teacher.label.style)">{{ config.teacher.label.value }}</p>
            <p class="min-h-5 text-[11px] font-medium">{{ comment("teacher") }}</p>
          </div>
        </div>

        <!-- Stacked (label/comment, then signature) -->
        <template v-else>
          <div
            :class="config.teacher.commentLabelPlacement === 'side' ? 'flex items-baseline gap-2' : ''"
          >
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
        </template>
      </div>

      <!-- Principal -->
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

    <!-- Director: signature only, bottom-right -->
    <div v-if="config.director.visible" class="flex justify-end">
      <div class="space-y-0.5 text-right">
        <img
          v-if="config.director.signatureMode === 'image' && config.director.signatureImage"
          :src="assetUrl(config.director.signatureImage)"
          alt="Director signature"
          class="ml-auto h-8 object-contain"
        />
        <div v-else class="border-foreground mt-5 mb-1 ml-auto w-36 border-b" />
        <p
          class="text-muted-foreground text-[10px]"
          :style="textStyle(config.director.signatureLabel.style)"
        >
          {{ config.director.signatureLabel.value }}
        </p>
      </div>
    </div>
  </div>
</template>
