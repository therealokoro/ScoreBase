<script lang="ts" setup>
import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ReportCardTemplate } from "~~/shared/constants/report-card"
import type { ComputedSubjectRow } from "~~/shared/utils/report-card"
import type { ScoreConfigSnapshot } from "~~/shared/validators/results"

const props = defineProps<{
  template: ReportCardTemplate
  data?: ReportCardData | null
}>()

// Phase 6: the template became a slot + block shape; this legacy fixed-shape view is kept
// ONLY so the old renderer keeps compiling until Phase 7 replaces it with the block
// registry. Every reference to `legacy` below is a known-stale code path.
type LegacyTemplate = {
  header: {
    logoPlacement: "left" | "center" | "right" | "left-right"
    logoPrimary: string | null
    logoSecondary: string | null
    showWatermark: boolean
    watermarkOpacity: number
    heading: string
    subheading: string
    paragraphs: {
      id: string
      text: string
      fontSize: number
      color: string
      bold: boolean
      align: "left" | "center" | "right"
    }[]
    info: { student: boolean; class: boolean; session: boolean; term: boolean; order: string[] }
  }
  body: {
    columns: {
      subject: true
      caBreakdown: boolean
      caTotal: boolean
      exam: boolean
      total: boolean
      grade: boolean
      remark: boolean
    }
  }
  summary: {
    placement: "header" | "footer"
    total: boolean
    average: boolean
    position: boolean
    outOf: boolean
  }
  footer: {
    remarks: {
      show: boolean
      teacher: { show: boolean; label: string; signature: boolean; signatureImage: string | null }
      principal: { show: boolean; label: string; signature: boolean; signatureImage: string | null }
    }
    classSummary: { show: boolean; highest: boolean; lowest: boolean; average: boolean }
    customBlocks: { id: string; label: string; content: string }[]
  }
}

const legacy = computed(() => props.template as unknown as LegacyTemplate)

/**
 * Normalised view of the report card. Real data (from the viewer) and the placeholder data (from
 * the builder) have different shapes, so every field the renderer needs is resolved here.
 */
interface ReportCardView {
  studentName: string
  studentSchoolId: string
  className: string
  sessionName: string
  termName: string
  subjectRows: ComputedSubjectRow[]
  scoreConfig: ScoreConfigSnapshot
  grandTotal: number | null
  average: number | null
  position: string
  totalStudents: number
  teacherRemark: string | null
  principalRemark: string | null
  allStudentTotals: number[]
}

const PLACEHOLDER: ReportCardView = {
  studentName: "Chibuike Idris",
  studentSchoolId: "STU-2026-0010",
  className: "JSS 1",
  sessionName: "2027/2028 Session",
  termName: "First Term",
  subjectRows: [
    {
      id: "ph-1",
      subjectName: "Mathematics",
      caScores: [18, 17, 15],
      caTotal: 50,
      exam: 38,
      total: 88,
      grade: "A",
      remark: "Excellent"
    },
    {
      id: "ph-2",
      subjectName: "English Language",
      caScores: [15, 14, 12],
      caTotal: 41,
      exam: 35,
      total: 76,
      grade: "A",
      remark: "Excellent"
    },
    {
      id: "ph-3",
      subjectName: "Basic Science",
      caScores: [12, 10, 11],
      caTotal: 33,
      exam: 35,
      total: 68,
      grade: "B",
      remark: "Very Good"
    }
  ],
  scoreConfig: { caCount: 3, caMaxScores: [20, 20, 20], examMax: 40 },
  grandTotal: 232,
  average: 77.33,
  position: "2nd",
  totalStudents: 32,
  teacherRemark: "A diligent and focused student.",
  principalRemark: "Keep up the excellent work.",
  allStudentTotals: [88, 83, 79, 74, 68, 65, 61, 58, 55, 52]
}

const view = computed<ReportCardView>(() => {
  const data = props.data
  if (!data) return PLACEHOLDER
  return {
    studentName: data.computed.studentName,
    studentSchoolId: data.computed.studentSchoolId,
    className: data.class.name,
    sessionName: data.term.session.name,
    termName: data.term.name,
    subjectRows: data.computed.subjectRows,
    scoreConfig: data.scoreConfig,
    grandTotal: data.computed.grandTotal,
    average: data.computed.average,
    position: data.computed.position,
    totalStudents: data.totalStudents,
    teacherRemark: data.teacherRemark,
    principalRemark: data.principalRemark,
    allStudentTotals: data.allStudentTotals
  }
})

const A4_WIDTH_PX = 794 // 210mm at 96dpi

const container = useTemplateRef("container")
const { width: containerWidth } = useElementSize(container)
const scale = computed(() => Math.min(1, (containerWidth.value || A4_WIDTH_PX) / A4_WIDTH_PX))

function assetUrl(pathname: string | null): string | null {
  return pathname ? `/images/${pathname}` : null
}

const logoPrimaryUrl = computed(() => assetUrl(legacy.value.header.logoPrimary))
const logoSecondaryUrl = computed(
  () => assetUrl(legacy.value.header.logoSecondary) ?? logoPrimaryUrl.value
)

const infoItems = computed(() => {
  const info = legacy.value.header.info as Record<string, unknown> & {
    order: string[]
    student: boolean
    class: boolean
    session: boolean
    term: boolean
  }
  const items: { label: string; value: string }[] = []
  for (const field of info.order) {
    if (!info[field]) continue
    if (field === "student") {
      items.push({ label: "Student Name", value: view.value.studentName })
      items.push({ label: "Student ID", value: view.value.studentSchoolId })
    } else if (field === "class") {
      items.push({ label: "Class", value: view.value.className })
    } else if (field === "session") {
      items.push({ label: "Session", value: view.value.sessionName })
    } else if (field === "term") {
      items.push({ label: "Term", value: view.value.termName })
    }
  }
  return items
})

const visibleColumns = computed(() => {
  const columns = legacy.value.body.columns
  const config = view.value.scoreConfig
  return [
    { key: "subject", label: "Subject" },
    ...(columns.caBreakdown
      ? Array.from({ length: config.caCount }, (_, i) => ({
          key: `ca_${i}`,
          label: `CA ${i + 1} (${config.caMaxScores[i] ?? 0})`
        }))
      : []),
    ...(columns.caTotal ? [{ key: "caTotal", label: "CA Total" }] : []),
    ...(columns.exam ? [{ key: "exam", label: `Exam (${config.examMax})` }] : []),
    ...(columns.total ? [{ key: "total", label: "Total" }] : []),
    ...(columns.grade ? [{ key: "grade", label: "Grade" }] : []),
    ...(columns.remark ? [{ key: "remark", label: "Remark" }] : [])
  ]
})

function cellValue(row: ComputedSubjectRow, key: string): string | number {
  if (key === "subject") return row.subjectName
  if (key.startsWith("ca_")) {
    const index = Number(key.slice(3))
    return row.caScores[index] ?? "—"
  }
  if (key === "caTotal") return row.caTotal ?? "—"
  if (key === "exam") return row.exam ?? "—"
  if (key === "total") return row.total ?? "—"
  if (key === "remark") return row.remark || "—"
  return ""
}

function isBlank(row: ComputedSubjectRow, key: string): boolean {
  if (key.startsWith("ca_")) return row.caScores[Number(key.slice(3))] === null
  if (key === "exam") return row.exam === null
  if (key === "total") return row.total === null
  if (key === "caTotal") return row.caTotal === null
  return false
}

const classStats = computed(() => {
  const totals = view.value.allStudentTotals
  if (totals.length === 0) return null
  return {
    highest: Math.max(...totals),
    lowest: Math.min(...totals),
    average: +(totals.reduce((sum, total) => sum + total, 0) / totals.length).toFixed(2)
  }
})
</script>

<template>
  <div ref="container" class="w-full overflow-hidden">
    <div
      class="report-card-print-root bg-card text-card-foreground relative origin-top-left p-8 shadow-sm [transform:scale(var(--rc-scale))] print:transform-none"
      :style="{ '--rc-scale': String(scale), width: '210mm', minHeight: '297mm' }"
    >
      <!-- Watermark -->
      <img
        v-if="legacy.header.showWatermark && logoPrimaryUrl"
        :src="logoPrimaryUrl"
        class="pointer-events-none absolute inset-0 h-full w-full object-contain select-none"
        :style="{ opacity: legacy.header.watermarkOpacity }"
        alt=""
        aria-hidden="true"
      />

      <div class="relative space-y-6">
        <!-- Header -->
        <header class="space-y-6">
          <!-- Left -->
          <div v-if="legacy.header.logoPlacement === 'left'" class="flex items-start gap-4">
            <img
              v-if="logoPrimaryUrl"
              :src="logoPrimaryUrl"
              alt="School logo"
              class="h-20 w-20 shrink-0 object-contain"
            />
            <div class="min-w-0 flex-1 space-y-1">
              <h1 v-if="legacy.header.heading" class="text-2xl font-bold tracking-tight">
                {{ legacy.header.heading }}
              </h1>
              <p v-if="legacy.header.subheading" class="text-muted-foreground text-sm font-medium">
                {{ legacy.header.subheading }}
              </p>
              <p
                v-for="paragraph in legacy.header.paragraphs"
                :key="paragraph.id"
                :style="{
                  fontSize: `${paragraph.fontSize}px`,
                  color: paragraph.color,
                  fontWeight: paragraph.bold ? 600 : 400,
                  textAlign: paragraph.align
                }"
              >
                {{ paragraph.text }}
              </p>
            </div>
          </div>

          <!-- Right -->
          <div
            v-else-if="legacy.header.logoPlacement === 'right'"
            class="flex flex-row-reverse items-start gap-4"
          >
            <img
              v-if="logoPrimaryUrl"
              :src="logoPrimaryUrl"
              alt="School logo"
              class="h-20 w-20 shrink-0 object-contain"
            />
            <div class="min-w-0 flex-1 space-y-1 text-right">
              <h1 v-if="legacy.header.heading" class="text-2xl font-bold tracking-tight">
                {{ legacy.header.heading }}
              </h1>
              <p v-if="legacy.header.subheading" class="text-muted-foreground text-sm font-medium">
                {{ legacy.header.subheading }}
              </p>
              <p
                v-for="paragraph in legacy.header.paragraphs"
                :key="paragraph.id"
                :style="{
                  fontSize: `${paragraph.fontSize}px`,
                  color: paragraph.color,
                  fontWeight: paragraph.bold ? 600 : 400,
                  textAlign: paragraph.align
                }"
              >
                {{ paragraph.text }}
              </p>
            </div>
          </div>

          <!-- Center -->
          <div
            v-else-if="legacy.header.logoPlacement === 'center'"
            class="flex flex-col items-center space-y-2 text-center"
          >
            <div v-if="logoPrimaryUrl" class="flex items-center justify-center gap-4">
              <img :src="logoPrimaryUrl" alt="School logo" class="h-20 w-20 object-contain" />
              <img
                v-if="logoSecondaryUrl"
                :src="logoSecondaryUrl"
                alt="School logo"
                class="h-20 w-20 object-contain"
              />
            </div>
            <h1 v-if="legacy.header.heading" class="text-2xl font-bold tracking-tight">
              {{ legacy.header.heading }}
            </h1>
            <p v-if="legacy.header.subheading" class="text-muted-foreground text-sm font-medium">
              {{ legacy.header.subheading }}
            </p>
            <p
              v-for="paragraph in legacy.header.paragraphs"
              :key="paragraph.id"
              :style="{
                fontSize: `${paragraph.fontSize}px`,
                color: paragraph.color,
                fontWeight: paragraph.bold ? 600 : 400,
                textAlign: paragraph.align
              }"
            >
              {{ paragraph.text }}
            </p>
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
            <div class="absolute inset-x-0 top-0 mx-auto max-w-[60%] space-y-1 text-center">
              <h1 v-if="legacy.header.heading" class="text-2xl font-bold tracking-tight">
                {{ legacy.header.heading }}
              </h1>
              <p v-if="legacy.header.subheading" class="text-muted-foreground text-sm font-medium">
                {{ legacy.header.subheading }}
              </p>
              <p
                v-for="paragraph in legacy.header.paragraphs"
                :key="paragraph.id"
                :style="{
                  fontSize: `${paragraph.fontSize}px`,
                  color: paragraph.color,
                  fontWeight: paragraph.bold ? 600 : 400,
                  textAlign: paragraph.align
                }"
              >
                {{ paragraph.text }}
              </p>
            </div>
          </div>

          <ReportCardSummaryRow
            v-if="legacy.summary.placement === 'header'"
            :summary="legacy.summary as unknown as ReportCardTemplate['main']"
            :total="view.grandTotal"
            :average="view.average"
            :position="view.position"
            :total-students="view.totalStudents"
          />
        </header>

        <!-- Student info -->
        <div
          v-if="infoItems.length"
          class="border-border grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-4"
        >
          <div v-for="item in infoItems" :key="item.label">
            <p class="text-muted-foreground text-xs">{{ item.label }}</p>
            <p class="font-semibold">{{ item.value }}</p>
          </div>
        </div>

        <!-- Score table -->
        <div class="border-border overflow-hidden rounded-lg border">
          <UiScrollArea class="grid overflow-x-auto" orientation="horizontal">
            <UiTable class="w-full table-auto" aria-label="Subject scores">
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead
                    v-for="column in visibleColumns"
                    :key="column.key"
                    class="whitespace-nowrap"
                    :class="column.key === 'subject' ? 'min-w-35' : 'text-center min-w-15'"
                  >
                    {{ column.label }}
                  </UiTableHead>
                </UiTableRow>
              </UiTableHeader>

              <UiTableBody>
                <UiTableRow v-for="row in view.subjectRows" :key="row.id">
                  <UiTableCell
                    v-for="column in visibleColumns"
                    :key="column.key"
                    :class="[
                      column.key === 'subject' ? 'font-medium' : 'text-center',
                      isBlank(row, column.key) ? 'text-muted-foreground' : ''
                    ]"
                  >
                    <UiBadge v-if="column.key === 'grade' && row.grade" variant="outline">
                      {{ row.grade }}
                    </UiBadge>
                    <template v-else>{{ cellValue(row, column.key) }}</template>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </UiScrollArea>
        </div>

        <ReportCardSummaryRow
          v-if="legacy.summary.placement === 'footer'"
          :summary="legacy.summary as unknown as ReportCardTemplate['main']"
          :total="view.grandTotal"
          :average="view.average"
          :position="view.position"
          :total-students="view.totalStudents"
        />

        <!-- Remarks -->
        <div v-if="legacy.footer.remarks.show" class="grid gap-6 sm:grid-cols-2">
          <div v-if="legacy.footer.remarks.teacher.show" class="space-y-1">
            <p class="text-muted-foreground text-xs">{{ legacy.footer.remarks.teacher.label }}</p>
            <p class="min-h-8 text-sm font-medium">{{ view.teacherRemark || "—" }}</p>
            <template v-if="legacy.footer.remarks.teacher.signature">
              <img
                v-if="legacy.footer.remarks.teacher.signatureImage"
                :src="assetUrl(legacy.footer.remarks.teacher.signatureImage) ?? undefined"
                alt="Teacher signature"
                class="h-10 object-contain"
              />
              <div v-else class="border-foreground mt-6 mb-1 w-40 border-b" />
              <p class="text-muted-foreground text-xs">
                {{ legacy.footer.remarks.teacher.label }}
              </p>
            </template>
          </div>

          <div v-if="legacy.footer.remarks.principal.show" class="space-y-1">
            <p class="text-muted-foreground text-xs">
              {{ legacy.footer.remarks.principal.label }}
            </p>
            <p class="min-h-8 text-sm font-medium">{{ view.principalRemark || "—" }}</p>
            <template v-if="legacy.footer.remarks.principal.signature">
              <img
                v-if="legacy.footer.remarks.principal.signatureImage"
                :src="assetUrl(legacy.footer.remarks.principal.signatureImage) ?? undefined"
                alt="Principal signature"
                class="h-10 object-contain"
              />
              <div v-else class="border-foreground mt-6 mb-1 w-40 border-b" />
              <p class="text-muted-foreground text-xs">
                {{ legacy.footer.remarks.principal.label }}
              </p>
            </template>
          </div>
        </div>

        <!-- Class summary -->
        <div
          v-if="legacy.footer.classSummary.show"
          class="border-border bg-muted/40 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border p-3 text-sm"
        >
          <div v-if="legacy.footer.classSummary.highest">
            <p class="text-muted-foreground text-[10px] tracking-wide uppercase">Highest</p>
            <p class="font-semibold">{{ classStats?.highest ?? "—" }}</p>
          </div>
          <div v-if="legacy.footer.classSummary.lowest">
            <p class="text-muted-foreground text-[10px] tracking-wide uppercase">Lowest</p>
            <p class="font-semibold">{{ classStats?.lowest ?? "—" }}</p>
          </div>
          <div v-if="legacy.footer.classSummary.average">
            <p class="text-muted-foreground text-[10px] tracking-wide uppercase">Class Average</p>
            <p class="font-semibold">
              {{ classStats ? `${classStats.average}%` : "—" }}
            </p>
          </div>
        </div>

        <!-- Custom blocks -->
        <div v-if="legacy.footer.customBlocks.length" class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="block in legacy.footer.customBlocks"
            :key="block.id"
            class="border-border rounded-lg border p-3 text-sm"
          >
            <p class="text-muted-foreground text-xs font-medium">{{ block.label }}</p>
            <p class="whitespace-pre-line">{{ block.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
