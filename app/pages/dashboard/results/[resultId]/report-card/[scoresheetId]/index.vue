<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const route = useRoute()
const resultId = route.params.resultId as string
const scoresheetId = route.params.scoresheetId as string

const { data, isPending, error } = useGetReportCard(scoresheetId)
const card = computed(() => data.value)

setPageBreadcrumbLabels({
  [resultId]: computed(() => data.value?.resultName),
  [scoresheetId]: computed(() => card.value?.computed.studentName ?? "Scores")
})

const infoItems = computed(() => {
  if (!card.value) return []
  return [
    { label: "Student Name", value: card.value.computed.studentName },
    { label: "Student ID", value: card.value.computed.studentSchoolId },
    { label: "Class", value: card.value.class.name },
    { label: "Session", value: card.value.term.session.name },
    { label: "Term", value: card.value.term.name }
  ]
})

const summaryItems = computed(() => {
  if (!card.value) return []
  return [
    { label: "Total Score", value: card.value.computed.grandTotal ?? "—" },
    {
      label: "Average",
      value: card.value.computed.average !== null ? `${card.value.computed.average}%` : "—"
    },
    { label: "Position", value: card.value.computed.position || "—" },
    { label: "Out of", value: `${card.value.totalStudents} students` }
  ]
})
</script>

<template>
  <Page :title="card ? `${card.computed.studentName} — Report Card` : 'Report Card'" :error="error">
    <div class="flex items-center justify-between gap-2">
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
        <UiButton
          :icon="ICONS.document"
          :to="`/dashboard/results/${resultId}/report-card/${scoresheetId}/full`"
        >
          View full report card
        </UiButton>
      </div>
    </div>

    <UiSkeleton v-if="isPending" class="h-[60vh] w-full" />
    <template v-else-if="card">
      <!-- Compact info strip -->
      <div class="flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div v-for="item in infoItems" :key="item.label">
          <p class="text-muted-foreground text-xs">{{ item.label }}</p>
          <p class="font-medium">{{ item.value }}</p>
        </div>
      </div>

      <!-- Quick-verify score table -->
      <div class="border-border overflow-hidden rounded-lg border">
        <UiScrollArea class="grid overflow-x-auto" orientation="horizontal">
          <UiTable class="w-full table-auto" aria-label="Subject scores">
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead class="min-w-35">Subject</UiTableHead>
                <UiTableHead class="text-center min-w-15">CA Total</UiTableHead>
                <UiTableHead class="text-center min-w-15">Exam</UiTableHead>
                <UiTableHead class="text-center min-w-15">Total</UiTableHead>
                <UiTableHead class="text-center min-w-15">Grade</UiTableHead>
              </UiTableRow>
            </UiTableHeader>

            <UiTableBody>
              <UiTableRow v-for="row in card.computed.subjectRows" :key="row.id">
                <UiTableCell class="font-medium">{{ row.subjectName }}</UiTableCell>
                <UiTableCell class="text-center">
                  <span v-if="row.caTotal !== null">{{ row.caTotal }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </UiTableCell>
                <UiTableCell class="text-center">
                  <span v-if="row.exam !== null">{{ row.exam }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </UiTableCell>
                <UiTableCell class="text-center">
                  <span v-if="row.total !== null">{{ row.total }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </UiTableCell>
                <UiTableCell class="text-center">{{ row.grade || "—" }}</UiTableCell>
              </UiTableRow>

              <UiTableRow v-if="card.computed.subjectRows.length === 0">
                <UiTableCell class="text-muted-foreground text-center text-sm">
                  No subject scores yet
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiScrollArea>
      </div>

      <!-- Compact summary footer -->
      <div class="flex flex-wrap gap-x-10 gap-y-3 text-sm">
        <div v-for="item in summaryItems" :key="item.label">
          <p class="text-muted-foreground text-xs">{{ item.label }}</p>
          <p class="font-semibold">{{ item.value }}</p>
        </div>
      </div>
    </template>
  </Page>
</template>
