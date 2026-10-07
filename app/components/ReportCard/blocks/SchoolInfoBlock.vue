<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { SchoolInfoConfig } from "~~/shared/constants/report-card"
import { LOGO_SIZE_MAP } from "~~/shared/constants/report-card"

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

const logoStyle = computed(() => ({
  height: `${LOGO_SIZE_MAP[props.config.logoSize]}px`,
  width: `${LOGO_SIZE_MAP[props.config.logoSize]}px`
}))

/** School name first, then only the paragraphs the admin actually filled in. */
const textFields = computed(() =>
  [props.config.schoolName, ...props.config.paragraphs].filter((field) => field.value !== "")
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
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <div class="min-w-0 flex-1 space-y-1">
        <p v-for="(field, index) in textFields" :key="index" :style="textStyle(field.style)">
          {{ field.value }}
        </p>
      </div>
    </div>

    <!-- Right -->
    <div v-else-if="config.logoPlacement === 'right'" class="flex flex-row-reverse items-start gap-4">
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <div class="min-w-0 flex-1 space-y-1">
        <p v-for="(field, index) in textFields" :key="index" :style="textStyle(field.style)">
          {{ field.value }}
        </p>
      </div>
    </div>

    <!-- Center -->
    <div v-else-if="config.logoPlacement === 'center'" class="flex flex-col items-center space-y-2">
      <div v-if="logoPrimaryUrl" class="flex items-center justify-center gap-4">
        <img :src="logoPrimaryUrl" alt="School logo" class="object-contain" :style="logoStyle" />
        <img
          v-if="logoSecondaryUrl"
          :src="logoSecondaryUrl"
          alt="School logo"
          class="object-contain"
          :style="logoStyle"
        />
      </div>
      <p v-for="(field, index) in textFields" :key="index" :style="textStyle(field.style)">
        {{ field.value }}
      </p>
    </div>

    <!-- Both sides -->
    <div v-else class="relative flex items-start justify-between gap-4">
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <img
        v-if="logoSecondaryUrl"
        :src="logoSecondaryUrl"
        alt="School logo"
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <div class="absolute inset-x-0 top-0 mx-auto max-w-[60%] space-y-1">
        <p v-for="(field, index) in textFields" :key="index" :style="textStyle(field.style)">
          {{ field.value }}
        </p>
      </div>
    </div>
  </div>
</template>
