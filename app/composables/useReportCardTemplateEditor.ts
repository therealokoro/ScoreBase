import {
  createDefaultReportCardTemplate,
  type ReportCardTemplate,
  type Slot
} from "~~/shared/constants/report-card"

export type ReportCardEditorTab = Slot | "general"

/**
 * Shared report card template editing logic: loads the saved template into a local working copy,
 * auto-saves changes (debounced), and exposes a reset action. Used by the builder page and the full
 * report card view so both can edit the same way.
 *
 * The active editor tab and the open block live here (not in the sheet) so they survive the control
 * sheet being closed and reopened.
 */
export const useReportCardTemplateEditor = () => {
  const { data: savedTemplate } = useGetReportCardTemplate()
  const updateTemplate = useUpdateReportCardTemplate()
  const resetTemplate = useResetReportCardTemplate()

  const editorTab = ref<ReportCardEditorTab>("general")
  const selectedBlockId = ref<string | null>(null)

  // Local working copy — edits land here first, then sync to the server via auto-save.
  const template = ref<ReportCardTemplate>(createDefaultReportCardTemplate())

  // Suppresses the auto-save watcher while we apply a server value, so loading the page
  // (or resetting) never writes the template straight back.
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
      useSonner.error("Failed to save the template. Changes will be lost if you leave.")
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

  const isResetting = computed(() => resetTemplate.isPending.value)

  async function resetToDefault() {
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

  return { template, editorTab, selectedBlockId, saveStatus, isResetting, resetToDefault }
}
