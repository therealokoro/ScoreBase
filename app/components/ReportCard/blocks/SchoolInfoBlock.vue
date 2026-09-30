<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { SchoolInfoConfig } from "~~/shared/constants/report-card"

import { textStyle } from "./text"

const props = defineProps<{
  config: SchoolInfoConfig
  data?: ReportCardData | null
  blockId?: string
}>()

function assetUrl(pathname: string | null): string | null {
  return pathname ? `/images/${pathname}` : null
}

const logoPrimaryUrl = computed(() => assetUrl(props.config.logoPrimary))
const logoSecondaryUrl = computed(
  () => assetUrl(props.config.logoSecondary) ?? logoPrimaryUrl.value
)

const textFields = computed(() =>
  [
    { id: "schoolName", text: props.config.schoolName },
    { id: "address", text: props.config.address },
    { id: "motto", text: props.config.motto },
    { id: "extraText", text: props.config.extraText }
  ].filter((field) => field.text.value !== "")
)
</script>

<template>
  <div data-block-type="school-info">
    <!-- Left -->
    <div v-if="config.logoPlacement === 'left'" class="flex items-start gap-4">
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="h-20 w-20 shrink-0 object-contain"
      />
      <div class="min-w-0 flex-1 space-y-1">
        <h1 v-for="field in textFields" :key="field.id" :style="textStyle(field.text.style)">
          {{ field.text.value }}
        </h1>
      </div>
    </div>

    <!-- Right -->
    <div
      v-else-if="config.logoPlacement === 'right'"
      class="flex flex-row-reverse items-start gap-4"
    >
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="h-20 w-20 shrink-0 object-contain"
      />
      <div class="min-w-0 flex-1 space-y-1">
        <h1 v-for="field in textFields" :key="field.id" :style="textStyle(field.text.style)">
          {{ field.text.value }}
        </h1>
      </div>
    </div>

    <!-- Center -->
    <div v-else-if="config.logoPlacement === 'center'" class="flex flex-col items-center space-y-2">
      <div v-if="logoPrimaryUrl" class="flex items-center justify-center gap-4">
        <img :src="logoPrimaryUrl" alt="School logo" class="h-20 w-20 object-contain" />
        <img
          v-if="logoSecondaryUrl"
          :src="logoSecondaryUrl"
          alt="School logo"
          class="h-20 w-20 object-contain"
        />
      </div>
      <h1 v-for="field in textFields" :key="field.id" :style="textStyle(field.text.style)">
        {{ field.text.value }}
      </h1>
    </div>

    <!-- Both sides -->
    <div v-else class="relative flex items-start justify-between gap-4">
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="h-20 w-20 shrink-0 object-contain"
      />
      <img
        v-if="logoSecondaryUrl"
        :src="logoSecondaryUrl"
        alt="School logo"
        class="h-20 w-20 shrink-0 object-contain"
      />
      <div class="absolute inset-x-0 top-0 mx-auto max-w-[60%] space-y-1">
        <h1 v-for="field in textFields" :key="field.id" :style="textStyle(field.text.style)">
          {{ field.text.value }}
        </h1>
      </div>
    </div>
  </div>
</template>
