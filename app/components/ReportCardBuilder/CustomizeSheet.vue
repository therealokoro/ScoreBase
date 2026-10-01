<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { ReportCardTemplate } from "~~/shared/constants/report-card"

const open = defineModel<boolean>("open", { default: false })
const template = defineModel<ReportCardTemplate>("template", { required: true })

const props = withDefaults(
  defineProps<{
    saveStatus?: "saved" | "saving" | "unsaved"
    resetting?: boolean
  }>(),
  { saveStatus: "saved", resetting: false }
)

const emit = defineEmits<{ reset: [] }>()

const resetDialogOpen = ref(false)

const statusBadge = computed(() => {
  switch (props.saveStatus) {
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
</script>

<template>
  <UiSheet v-model:open="open">
    <UiSheetContent side="right" class="flex w-full flex-col gap-0 p-0 sm:max-w-md">
      <UiSheetHeader class="space-y-2 border-b border-border p-4">
        <div class="flex items-center justify-between gap-2">
          <UiSheetTitle class="text-base">Customize report card</UiSheetTitle>
          <UiBadge variant="outline" class="gap-1.5 rounded-full" :class="statusBadge.class">
            <Icon
              :name="statusBadge.icon"
              class="size-3"
              :class="statusBadge.spin && 'animate-spin'"
            />
            {{ statusBadge.label }}
          </UiBadge>
        </div>
        <UiSheetDescription class="text-xs">
          Changes save automatically. The preview updates as you edit.
        </UiSheetDescription>
      </UiSheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <ReportCardBuilderBlockEditor v-model:template="template" />
      </div>

      <div class="border-t border-border p-4">
        <UiAlertDialog v-model:open="resetDialogOpen">
          <UiAlertDialogTrigger as-child>
            <UiButton
              variant="outline"
              size="sm"
              :icon="ICONS.restore"
              text="Reset to default"
              :loading="resetting"
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
              <UiAlertDialogAction variant="destructive" @click="emit('reset')">
                Reset
              </UiAlertDialogAction>
            </UiAlertDialogFooter>
          </UiAlertDialogContent>
        </UiAlertDialog>
      </div>
    </UiSheetContent>
  </UiSheet>
</template>
