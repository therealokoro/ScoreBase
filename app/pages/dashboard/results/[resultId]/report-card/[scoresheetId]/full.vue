<script lang="ts" setup>
import { createDefaultReportCardTemplate } from "~~/shared/constants/report-card"

import { ICONS } from "#shared/constants/icons"

definePageMeta({ layout: "fullscreen" })

const route = useRoute()
const resultId = route.params.resultId as string
const scoresheetId = route.params.scoresheetId as string

const { isAdmin } = useAuth()

const { data, isPending } = useGetReportCard(scoresheetId)
const card = computed(() => data.value)

const { data: templateData } = useGetReportCardTemplate()
const template = computed(() => templateData.value ?? createDefaultReportCardTemplate())

// The top bar is rendered here (not in the layout): the layout only provides the blank-canvas
// shell, so page-specific actions (student name, admin check) stay co-located. Everything in
// the bar is print:hidden, leaving only the A4 document for window.print().
function initPrintAction() {
  window.print()
}
</script>

<template>
  <div>
    <!-- Minimal top bar -->
    <header
      class="bg-background border-border flex h-12 items-center gap-3 border-b px-4 print:hidden"
    >
      <UiButton
        variant="ghost"
        size="icon-sm"
        :icon="ICONS.back"
        label="Back to report card overview"
        :to="`/dashboard/results/${resultId}/report-card/${scoresheetId}`"
      />

      <div class="ml-auto flex items-center gap-3">
        <UiButton
          variant="ghost"
          :icon="ICONS.scoresheet"
          :to="`/dashboard/results/${resultId}/${scoresheetId}`"
        >
          Edit {{ card?.computed.studentName }}'s Scores
        </UiButton>
        <UiButton
          v-if="isAdmin"
          variant="outline"
          :icon="ICONS.settings"
          to="/dashboard/report-card-builder"
        >
          Customize template
        </UiButton>
        <UiButton :icon="ICONS.print" @click="initPrintAction()">Print</UiButton>
      </div>
    </header>

    <!-- Full report card -->
    <div class="bg-muted/40 flex justify-center p-6 print:p-0">
      <div class="w-fit bg-card shadow-sm">
        <UiSkeleton v-if="isPending" class="h-[70vh] w-[60vw]" />
        <ReportCardTemplatePreview v-else-if="card" :template="template" :data="card" />
      </div>
    </div>
  </div>
</template>
