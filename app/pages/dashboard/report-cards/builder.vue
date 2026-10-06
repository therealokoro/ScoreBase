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

      <UiButton :icon="ICONS.settings" text="Customize" @click="sheetOpen = true" />
    </div>

    <!-- The preview spans the full width; all controls live in the sheet -->
    <div class="w-full">
      <ReportCardTemplatePreview :template="template" />
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
