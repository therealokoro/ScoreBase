<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import {
  DEFAULT_REPORT_CARD_TEMPLATE,
  type ReportCardTemplate
} from "~~/shared/constants/kv-settings"

definePageMeta({ middleware: ["admin-only"] })

const { data: savedTemplate } = useGetReportCardTemplate()
const updateTemplate = useUpdateReportCardTemplate()
const resetTemplate = useResetReportCardTemplate()

// Local working copy — the admin edits this; it syncs to the server via auto-save.
const template = ref<ReportCardTemplate>(DEFAULT_REPORT_CARD_TEMPLATE)

// Suppresses the auto-save watcher while we apply a server value, so loading the
// page (or resetting) never writes the template straight back.
let applyingServerValue = false

watch(
  savedTemplate,
  (value) => {
    if (!value) return
    applyingServerValue = true
    template.value = structuredClone(toRaw(value))
    nextTick(() => {
      applyingServerValue = false
    })
  },
  { immediate: true }
)

const saveStatus = ref<"saved" | "saving" | "unsaved">("saved")

const debouncedSave = useDebounceFn(async () => {
  saveStatus.value = "saving"
  try {
    await updateTemplate.mutateAsync(template.value)
    saveStatus.value = "saved"
  } catch {
    saveStatus.value = "unsaved"
    useSonner.error("Failed to save template. Changes will be lost if you leave.")
  }
}, 2000)

watch(
  template,
  () => {
    if (applyingServerValue) return
    saveStatus.value = "unsaved"
    debouncedSave()
  },
  { deep: true }
)

const statusBadge = computed(() => {
  switch (saveStatus.value) {
    case "saving":
      return {
        label: "Saving...",
        icon: ICONS.loading,
        spin: true,
        class: "border-warning/30 bg-warning/15 text-warning"
      }
    case "unsaved":
      return {
        label: "Unsaved changes",
        icon: ICONS.warning,
        spin: false,
        class: "border-destructive/30 bg-destructive/15 text-destructive"
      }
    default:
      return {
        label: "Saved",
        icon: ICONS.check,
        spin: false,
        class: "border-success/30 bg-success/15 text-success"
      }
  }
})

const resetDialogOpen = ref(false)

async function handleReset() {
  try {
    const defaults = await resetTemplate.mutateAsync()
    applyingServerValue = true
    template.value = structuredClone(toRaw(defaults))
    nextTick(() => {
      applyingServerValue = false
    })
    saveStatus.value = "saved"
    useSonner.success("Report card template reset to defaults")
  } catch (error) {
    useSonner.error((error as Error).message || "Failed to reset the template")
  }
}
</script>

<template>
  <Page
    title="Report Card Template"
    description="Customize the layout, columns, and content of printed report cards"
  >
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <!-- Preview (left on desktop, second on mobile) -->
      <div class="order-2 min-w-0 lg:order-1">
        <ReportCardTemplatePreview :template="template" />
      </div>

      <!-- Controls (right on desktop, first on mobile) -->
      <div class="order-1 lg:order-2">
        <div class="sticky top-4 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <UiBadge variant="outline" class="gap-1.5 rounded-full" :class="statusBadge.class">
              <Icon
                :name="statusBadge.icon"
                class="size-3"
                :class="statusBadge.spin && 'animate-spin'"
              />
              {{ statusBadge.label }}
            </UiBadge>
          </div>

          <UiTabs default-value="header" class="w-full">
            <UiTabsList class="grid w-full grid-cols-3">
              <UiTabsTrigger value="header">Header</UiTabsTrigger>
              <UiTabsTrigger value="body">Body</UiTabsTrigger>
              <UiTabsTrigger value="footer">Footer</UiTabsTrigger>
            </UiTabsList>

            <UiTabsContent value="header" class="mt-4">
              <ReportCardBuilderHeaderSection v-model:template="template" />
            </UiTabsContent>
            <UiTabsContent value="body" class="mt-4">
              <ReportCardBuilderBodySection v-model:template="template" />
            </UiTabsContent>
            <UiTabsContent value="footer" class="mt-4">
              <ReportCardBuilderFooterSection v-model:template="template" />
            </UiTabsContent>
          </UiTabs>

          <UiSeparator />

          <UiAlertDialog v-model:open="resetDialogOpen">
            <UiAlertDialogTrigger as-child>
              <UiButton
                variant="outline"
                :icon="ICONS.restore"
                text="Reset to default"
                :loading="resetTemplate.isPending.value"
                block
              />
            </UiAlertDialogTrigger>
            <UiAlertDialogContent>
              <UiAlertDialogHeader>
                <UiAlertDialogTitle>Reset report card template?</UiAlertDialogTitle>
                <UiAlertDialogDescription>
                  This replaces the current template with the default layout. This cannot be undone.
                </UiAlertDialogDescription>
              </UiAlertDialogHeader>
              <UiAlertDialogFooter>
                <UiAlertDialogCancel />
                <UiAlertDialogAction variant="destructive" @click="handleReset">
                  Reset
                </UiAlertDialogAction>
              </UiAlertDialogFooter>
            </UiAlertDialogContent>
          </UiAlertDialog>
        </div>
      </div>
    </div>
  </Page>
</template>
