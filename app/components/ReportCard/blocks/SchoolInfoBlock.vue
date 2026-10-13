<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { SchoolInfoConfig, StyledText } from "~~/shared/constants/report-card"
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

type HeaderLine = { kind: "text"; field: StyledText } | { kind: "badge" }

/**
 * School name, then the admin's paragraphs, with the "GOVERNMENT APPROVED" badge injected at
 * `badgeAfterParagraph` (0 = straight after the school name). Empty text lines are dropped after
 * placement is resolved so the badge never jumps position.
 */
const headerLines = computed<HeaderLine[]>(() => {
  const config = props.config
  const lines: HeaderLine[] = [{ kind: "text", field: config.schoolName }]

  config.paragraphs.forEach((paragraph, index) => {
    lines.push({ kind: "text", field: paragraph })
    if (config.showGovernmentApprovedBadge && config.badgeAfterParagraph === index + 1) {
      lines.push({ kind: "badge" })
    }
  })

  if (config.showGovernmentApprovedBadge && config.badgeAfterParagraph === 0) {
    lines.splice(1, 0, { kind: "badge" })
  }
  if (config.showGovernmentApprovedBadge && !lines.some((line) => line.kind === "badge")) {
    lines.push({ kind: "badge" })
  }

  return lines.filter((line) => line.kind === "badge" || line.field.value !== "")
})
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
        <template v-for="(line, index) in headerLines" :key="index">
          <div v-if="line.kind === 'badge'" class="my-1 flex justify-center">
            <span
              class="bg-destructive text-destructive-foreground rounded px-3 py-0.5 text-xs font-bold tracking-wider"
            >
              GOVERNMENT APPROVED
            </span>
          </div>
          <p v-else :style="textStyle(line.field.style)">{{ line.field.value }}</p>
        </template>
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
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <div class="min-w-0 flex-1 space-y-1">
        <template v-for="(line, index) in headerLines" :key="index">
          <div v-if="line.kind === 'badge'" class="my-1 flex justify-center">
            <span
              class="bg-destructive text-destructive-foreground rounded px-3 py-0.5 text-xs font-bold tracking-wider"
            >
              GOVERNMENT APPROVED
            </span>
          </div>
          <p v-else :style="textStyle(line.field.style)">{{ line.field.value }}</p>
        </template>
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
      <template v-for="(line, index) in headerLines" :key="index">
        <div v-if="line.kind === 'badge'" class="my-1 flex justify-center">
          <span
            class="bg-destructive text-destructive-foreground rounded px-3 py-0.5 text-xs font-bold tracking-wider"
          >
            GOVERNMENT APPROVED
          </span>
        </div>
        <p v-else :style="textStyle(line.field.style)">{{ line.field.value }}</p>
      </template>
    </div>

    <!-- Both sides: logos flank an in-flow centre column so the header keeps its own height -->
    <div v-else class="flex items-start justify-between gap-4">
      <img
        v-if="logoPrimaryUrl"
        :src="logoPrimaryUrl"
        alt="School logo"
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <!-- Keeps the centre column centred when only one side has a logo -->
      <div v-else-if="logoSecondaryUrl" class="shrink-0" :style="logoStyle" aria-hidden="true" />

      <div class="min-w-0 flex-1 space-y-0.5">
        <template v-for="(line, index) in headerLines" :key="index">
          <div v-if="line.kind === 'badge'" class="my-1 flex justify-center">
            <span
              class="bg-destructive text-destructive-foreground rounded px-3 py-0.5 text-xs font-bold tracking-wider"
            >
              GOVERNMENT APPROVED
            </span>
          </div>
          <p v-else :style="textStyle(line.field.style)">{{ line.field.value }}</p>
        </template>
      </div>

      <img
        v-if="logoSecondaryUrl"
        :src="logoSecondaryUrl"
        alt="School logo"
        class="shrink-0 object-contain"
        :style="logoStyle"
      />
      <div v-else-if="logoPrimaryUrl" class="shrink-0" :style="logoStyle" aria-hidden="true" />
    </div>
  </div>
</template>
