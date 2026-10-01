<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

definePageMeta({ middleware: ["admin-only"] })

const { template, saveStatus, isResetting, resetToDefault } = useReportCardTemplateEditor()

const sheetOpen = ref(false)
</script>

<template>
  <Page
    title="Report Card Template"
    description="Customize the layout, columns, and content of printed report cards"
  >
    <div class="flex items-center justify-between gap-2 lg:hidden">
      <UiButton :icon="ICONS.settings" text="Customize" block @click="sheetOpen = true" />
    </div>

    <div class="flex items-start gap-4">
      <!-- Preview stays put while the controls scroll -->
      <div class="min-w-0 flex-1">
        <ReportCardTemplatePreview :template="template" />
      </div>

      <!-- Controls: a side panel on desktop, a sheet on smaller screens -->
      <div class="sticky top-4 hidden w-96 shrink-0 lg:block">
        <div class="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <UiHeading :level="6" class="font-semibold">Customize</UiHeading>
            <UiBadge
              variant="outline"
              class="gap-1.5 rounded-full"
              :class="
                saveStatus === 'saved'
                  ? 'border-success/30 bg-success/15 text-success'
                  : saveStatus === 'saving'
                    ? 'border-warning/30 bg-warning/15 text-warning'
                    : 'border-destructive/30 bg-destructive/15 text-destructive'
              "
            >
              {{
                saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"
              }}
            </UiBadge>
          </div>

          <ReportCardBuilderBlockEditor v-model:template="template" />
        </div>
      </div>
    </div>

    <ReportCardBuilderCustomizeSheet
      v-model:open="sheetOpen"
      v-model:template="template"
      :save-status="saveStatus"
      :resetting="isResetting"
      @reset="resetToDefault"
    />
  </Page>
</template>
