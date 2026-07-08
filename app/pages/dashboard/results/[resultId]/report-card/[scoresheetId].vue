<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const route = useRoute()
const resultId = route.params.resultId as string
const scoresheetId = route.params.scoresheetId as string

const { data, isPending, error } = useGetReportCard(scoresheetId)
const card = computed(() => data.value)

setPageBreadcrumbLabels({
  [route.params.resultId as string]: computed(() => data.value?.resultName),
  [route.params.scoresheetId as string]: computed(
    () => card.value?.computed.studentName ?? "Scores"
  )
})

function initPrintAction() {
  window.print()
}
</script>

<template>
  <Page
    :title="card ? `${card.computed.studentName} — Report Card` : 'Report Card'"
    :loading="isPending"
    :error="error"
  >
    <div class="flex items-center justify-between gap-2 print:hidden">
      <UiButton :icon="ICONS.scoresheet" :to="`/dashboard/results/${resultId}/${scoresheetId}`">
        Edit {{ card?.computed.studentName }}'s Scores
      </UiButton>

      <div class="flex items-center gap-3">
        <UiButton
          variant="ghost"
          :icon="ICONS.previous"
          :to="`/dashboard/results/${resultId}/report-card`"
        >
          All Students
        </UiButton>
        <UiButton :icon="ICONS.print" @click="initPrintAction()">Print</UiButton>
      </div>
    </div>

    <ReportCardDocument v-if="card" :data="card" />
  </Page>
</template>
