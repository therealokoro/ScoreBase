<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

definePageMeta({ middleware: ["admin-only"] })

const { template, editorTab, selectedBlockId, saveStatus, isResetting, resetToDefault } =
  useReportCardTemplateEditor()

const sheetOpen = ref(false)
</script>

<template>
  <Page
    title="Report Card Template"
    description="Customize the layout, columns, and content of printed report cards"
  >
    <div class="flex items-center justify-between gap-3">
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
        {{ saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved" }}
      </UiBadge>
    </div>

    <!-- The preview spans the full width; all controls live in the sheet -->
    <div class="w-full">
      <ReportCardTemplatePreview :template="template" />
    </div>

    <!-- Floating customize button, always available while the sheet is closed -->
    <UiButton
      v-if="!sheetOpen"
      size="icon-lg"
      :icon="ICONS.settings"
      label="Customize report card"
      class="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg print:hidden"
      @click="sheetOpen = true"
    />

    <ReportCardBuilderCustomizeSheet
      v-model:open="sheetOpen"
      v-model:template="template"
      v-model:tab="editorTab"
      v-model:selected-block-id="selectedBlockId"
      :save-status="saveStatus"
      :resetting="isResetting"
      @reset="resetToDefault"
    />
  </Page>
</template>
