<script lang="ts" setup>
import { createDefaultReportCardTemplate } from "~~/shared/constants/report-card"

import { ICONS } from "#shared/constants/icons"
import { normalizeReportCardData } from "~/components/ReportCard/blocks/placeholder"
import { buildReportCardXlsx, safeFileName, xlsxBlob } from "~/utils/report-card-export"

definePageMeta({ layout: "fullscreen" })

const route = useRoute()
const resultId = route.params.resultId as string
const scoresheetId = route.params.scoresheetId as string

const { isAdmin } = useAuth()

const { data, isPending } = useGetReportCard(scoresheetId)
const card = computed(() => data.value)

/** The normalised view model the renderer reads — the export uses the same values. */
const view = computed(() => (card.value ? normalizeReportCardData(card.value) : null))

/**
 * The document title, so printing to PDF or saving the page carries a meaningful name (browsers use
 * it as the default filename): "Adewumi Ajibola Victory's 2025/2026 3rd Term Result".
 */
const cardTitle = computed(() => {
  const current = view.value
  if (!current) return "Report Card"
  return `${current.studentName}'s ${current.sessionName} ${current.termName} Result`
})

useHead({ title: cardTitle })

const { template, editorTab, selectedBlockId, saveStatus, isResetting, resetToDefault } =
  useReportCardTemplateEditor()

const sheetOpen = ref(false)
const isExporting = ref(false)

// The top bar is rendered here (not in the layout): the layout only provides the blank-canvas
// shell, so page-specific actions (student name, admin check) stay co-located. Everything in
// the bar is print:hidden, leaving only the A4 document for window.print().
function initPrintAction() {
  window.print()
}

/** The school name and its colour, so the spreadsheet carries the school's own branding. */
const sheetBranding = computed(() => {
  const school = template.value.header.find(
    (block) => block.type === "school-info" && !block.hidden
  )
  if (school?.type !== "school-info") return {}
  return {
    schoolName: school.config.schoolName.value,
    accentColor: school.config.schoolName.style.color
  }
})

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/** Spreadsheet export: a real .xlsx workbook, styled and ready to print or total up. */
async function exportSpreadsheet() {
  const current = view.value
  if (!current || isExporting.value) return

  isExporting.value = true
  try {
    const bytes = await buildReportCardXlsx(current, sheetBranding.value)
    download(xlsxBlob(bytes), `${safeFileName(cardTitle.value)}.xlsx`)
  } catch (error) {
    useSonner.error("Could not build the spreadsheet", { description: String(error) })
  } finally {
    isExporting.value = false
  }
}

/**
 * PDF export. The browser's own "Save as PDF" produces a real vector PDF — selectable, searchable
 * text at A4 with the card's print stylesheet — so this opens the print dialog rather than
 * rasterising the card. The document title (set above) is the filename it suggests.
 */
function exportPdf() {
  window.print()
}
</script>

<template>
  <div>
    <!-- Minimal top bar -->
    <header
      class="bg-background border-border sticky top-0 z-20 flex h-12 items-center gap-3 border-b px-4 print:hidden"
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

        <!-- Export options are post-MVP: markup only for now. -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton
              variant="outline"
              :icon="ICONS.export"
              text="Export As"
              :icon-right="ICONS.down"
            />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem
              :icon="ICONS.spreadsheet"
              title="Excel spreadsheet (.xlsx)"
              :disabled="!view || isExporting"
              @select="exportSpreadsheet()"
            />
            <UiDropdownMenuItem
              :icon="ICONS.document"
              title="PDF (Save as PDF)"
              :disabled="!view"
              @select="exportPdf()"
            />
          </UiDropdownMenuContent>
        </UiDropdownMenu>

        <UiButton v-if="isAdmin" variant="outline" :icon="ICONS.settings" @click="sheetOpen = true">
          Customize template
        </UiButton>
        <UiButton :icon="ICONS.print" @click="initPrintAction()">Print</UiButton>
      </div>
    </header>

    <!-- Full report card -->
    <div class="bg-muted/40 flex justify-center p-6 print:p-0">
      <div class="w-full max-w-6xl bg-card shadow-sm">
        <UiSkeleton v-if="isPending" class="h-[70vh] w-full" />
        <ReportCardTemplatePreview
          v-else-if="card"
          :template="template"
          :data="card"
          :max-scale="1.25"
        />
      </div>
    </div>

    <ReportCardBuilderCustomizeSheet
      v-model:open="sheetOpen"
      v-model:template="template"
      v-model:tab="editorTab"
      v-model:selected-block-id="selectedBlockId"
      :save-status="saveStatus"
      :resetting="isResetting"
      @reset="resetToDefault"
    />
  </div>
</template>
