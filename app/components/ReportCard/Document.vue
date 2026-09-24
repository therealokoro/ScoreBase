<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"

const props = defineProps<{ data: ReportCardData }>()

const {
  scoreConfig,
  computed: card,
  teacherRemark,
  principalRemark,
  totalStudents
} = toRefs(props.data)

const caHeaders = computed(() =>
  Array.from({ length: scoreConfig.value.caCount }, (_, i) => ({
    label: `CA ${i + 1}`,
    max: scoreConfig.value.caMaxScores[i] ?? 0
  }))
)

const infoColumns = computed(() => [
  { label: "Student Name", value: card.value.studentName },
  { label: "Student ID", value: card.value.studentSchoolId },
  { label: "Session", value: props.data.term.session.name },
  { label: "Class", value: props.data.class.name }
])

const summaryColumns = computed(() => [
  { label: "Total Score", value: card.value.grandTotal ?? "—" },
  { label: "Average", value: card.value.average !== null ? `${card.value.average}%` : "—" },
  { label: "Position", value: card.value.position || "—" },
  { label: "Out of", value: `${totalStudents.value} students` }
])

const sharedStyles = "rounded-lg border bg-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
</script>

<template>
  <div class="report-card-print-root w-full mx-auto space-y-6 print:space-y-4">
    <!-- Header -->
    <div class="rounded-lg border bg-card p-6 text-center space-y-1">
      <h1 class="lg:text-lg font-bold tracking-tight">
        {{ data.class.name }} — {{ data.term.session.name }} {{ data.term.name }} Report Card
      </h1>
      <p class="text-sm text-muted-foreground">{{ data.resultName }}</p>
    </div>

    <!-- Student Info -->
    <div :class="sharedStyles">
      <div v-for="item in infoColumns" :key="item.label">
        <p class="text-xs text-muted-foreground">{{ item.label }}</p>
        <p class="font-semibold">{{ item.value }}</p>
      </div>
    </div>

    <!-- Subject Scores Table — horizontally scrollable on mobile -->
    <div class="rounded-lg border bg-card">
      <UiScrollArea class="grid overflow-x-auto" orientation="horizontal">
        <UiTable class="w-full table-auto">
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead class="min-w-35">Subject</UiTableHead>
              <UiTableHead
                v-for="ca in caHeaders"
                :key="ca.label"
                class="text-center whitespace-nowrap min-w-15"
              >
                {{ ca.label }}
                <span class="block text-[10px] font-normal text-muted-foreground"
                  >({{ ca.max }})</span
                >
              </UiTableHead>
              <UiTableHead class="text-center whitespace-nowrap min-w-15">
                Exam
                <span class="block text-[10px] font-normal text-muted-foreground"
                  >({{ scoreConfig.examMax }})</span
                >
              </UiTableHead>
              <UiTableHead class="text-center min-w-15">Total</UiTableHead>
              <UiTableHead class="text-center min-w-15">Grade</UiTableHead>
              <UiTableHead class="min-w-25">Remark</UiTableHead>
            </UiTableRow>
          </UiTableHeader>

          <UiTableBody>
            <UiTableRow v-for="row in card.subjectRows" :key="row.id">
              <UiTableCell class="font-medium">{{ row.subjectName }}</UiTableCell>
              <UiTableCell
                v-for="(score, i) in row.caScores"
                :key="i"
                class="text-center"
                :class="score === null ? 'text-muted-foreground' : ''"
              >
                {{ score ?? "—" }}
              </UiTableCell>
              <UiTableCell
                class="text-center"
                :class="row.exam === null ? 'text-muted-foreground' : ''"
              >
                {{ row.exam ?? "—" }}
              </UiTableCell>
              <UiTableCell class="text-center font-semibold">
                {{ row.total ?? "—" }}
              </UiTableCell>
              <UiTableCell class="text-center">
                <UiBadge v-if="row.grade" variant="outline">{{ row.grade }}</UiBadge>
                <span v-else class="text-muted-foreground">—</span>
              </UiTableCell>
              <UiTableCell class="text-muted-foreground">{{ row.remark || "—" }}</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiScrollArea>
    </div>

    <!-- Summary -->
    <div :class="sharedStyles">
      <div v-for="item in summaryColumns" :key="item.label">
        <p class="text-xs text-muted-foreground">{{ item.label }}</p>
        <p class="font-semibold">{{ item.value }}</p>
      </div>
    </div>

    <!-- Remarks -->
    <div class="rounded-lg border bg-card p-4 grid sm:grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs text-muted-foreground mb-1">Class Teacher's Remark</p>
        <p class="font-semibold min-h-8">{{ teacherRemark || "—" }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground mb-1">Principal's Remark</p>
        <p class="font-semibold min-h-8">{{ principalRemark || "—" }}</p>
      </div>
    </div>
  </div>
</template>
