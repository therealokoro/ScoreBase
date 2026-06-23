<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const route = useRoute()
const resultId = route.params.resultId as string

const { data, isPending, error, refetch } = useGetResult(resultId)
const result = computed(() => data.value)

const auth = useAuth()
const isAdmin = computed(() => auth.currentUser.value?.role === "admin")

// Set breadcrumb label once data resolves
setPageBreadcrumbLabel(computed(() => result.value?.name))

// Status badge — color-coded, same mapping as the list table
// ---------------------------------------------------------------------------
const STATUS_BADGE_VARIANTS: Record<string, any> = {
  draft: "secondary",
  submitted: "warning",
  reviewed: "info",
  published: "success"
}

const statusVariant = computed(() => STATUS_BADGE_VARIANTS[result.value?.status ?? ""] ?? "outline")

// Per-scoresheet completion — fraction of subject scores that are fully
// entered (both CAs and exam filled in) out of total subjects on the sheet
// ---------------------------------------------------------------------------
function isScoreComplete(score: { caScores: (number | null)[]; exam: number | null }) {
  return score.exam !== null && score.caScores.every((s) => s !== null)
}

// add progress to each scoresheet
const scoresheetsWithProgress = computed(() => {
  return (result.value?.scoresheets ?? []).map((sheet) => {
    const total = sheet.subjectScores.length
    const completed = sheet.subjectScores.filter(isScoreComplete).length
    return {
      ...sheet,
      totalSubjects: total,
      completedSubjects: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      isFullyScored: total > 0 && completed === total
    }
  })
})

// Result-level summary stats
const resultStats = computed(() => {
  const sheets = scoresheetsWithProgress.value
  const fullyScored = sheets.filter((s) => s.isFullyScored).length

  return [
    { label: "Total Students", value: sheets.length, icon: ICONS.students },
    { label: "Total Scored", value: fullyScored, icon: ICONS.grading },
    { label: "Total Unscored", value: sheets.length - fullyScored, icon: ICONS.cancel }
  ]
})

// Lifecycle actions
// ---------------------------------------------------------------------------
const updateStatus = useUpdateResultStatus()
function handleStatusChange(status: any) {
  useSonner.promise(updateStatus.mutateAsync({ id: resultId, status }), {
    loading: "Updating result status...",
    success: () => {
      refetch()
      return `Result moved to ${capitalize(status)}`
    },
    error: (e: any) => e.message
  })
}

// The single primary action available right now, based on role + current status
const primaryAction = computed(() => {
  const status = result.value?.status
  if (!status) return null

  if (status === "draft") {
    return { label: "Submit for Review", nextStatus: "submitted", icon: ICONS.send }
  }
  if (isAdmin.value && status === "submitted") {
    return { label: "Mark as Reviewed", nextStatus: "reviewed", icon: ICONS.check }
  }
  if (isAdmin.value && status === "reviewed") {
    return { label: "Publish Result", nextStatus: "published", icon: ICONS.publish }
  }
  if (isAdmin.value && status === "published") {
    return { label: "Unpublish Result", nextStatus: "reviewed", icon: ICONS.undo }
  }
  return null
})

// canReject only applies to submitted/reviewed — published has its own
// dedicated "Unpublish" action above instead, since "send back to draft"
// from a published state would be a much bigger, more disruptive jump
const canReject = computed(
  () =>
    isAdmin.value && (result.value?.status === "submitted" || result.value?.status === "reviewed")
)

// Delete — only available while still a draft
const deleteResult = useDeleteResult()
const openDeleteDialog = ref(false)

function handleDelete() {
  useSonner.promise(deleteResult.mutateAsync({ id: resultId }), {
    loading: "Deleting result...",
    success: () => {
      navigateTo("/dashboard/results")
      return "Result deleted successfully"
    },
    error: (e: any) => e.message
  })
}
</script>

<template>
  <Page :title="result?.name || 'Loading...'" :loading="isPending" :error="error ?? undefined">
    <template #actions>
      <div class="flex items-center gap-2">
        <UiButton
          v-if="result?.status === 'published' || result?.status === 'reviewed'"
          variant="outline"
          :icon="ICONS.print"
          :to="`/dashboard/results/${resultId}/report-card`"
          text="Report Card"
        />

        <UiDropdownMenu
          v-if="canReject || primaryAction || (isAdmin && result?.status === 'draft')"
        >
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" size="icon" :icon="ICONS.more" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem
              v-if="primaryAction"
              :icon="primaryAction.icon"
              :loading="updateStatus.isPending.value"
              :title="primaryAction.label"
              class="text-sm"
              @select="handleStatusChange(primaryAction.nextStatus)"
            />
            <UiDropdownMenuItem
              v-if="canReject"
              title="Send Back to Draft"
              :icon="ICONS.undo"
              class="text-sm"
              @select="handleStatusChange('draft')"
            />
            <UiDropdownMenuItem
              v-if="isAdmin && result?.status === 'draft'"
              title="Delete Result"
              :icon="ICONS.delete"
              class="text-sm text-destructive"
              @select="openDeleteDialog = true"
            />
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </template>

    <!-- Loading -->
    <AppEntitySkeleton v-if="isPending" :count="4" />

    <!-- Show result content -->
    <template v-else-if="result">
      <!-- Header info row: status + stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="flex items-center justify-between gap-2 px-4 py-2 rounded-lg border">
          <p class="text-muted-foreground text-xs font-medium text-ellipsis truncate">Status</p>
          <UiBadge :variant="statusVariant" class="w-fit">
            {{ capitalize(result.status) }}
          </UiBadge>
        </div>

        <AppStatsCard v-for="item in resultStats" v-bind="item" class="col-span-1" />
      </div>

      <!-- Scoresheet list -->
      <div class="w-full space-y-2">
        <ui-heading :level="6" class="font-semibold">Scoresheets</ui-heading>
        <p class="text-sm text-muted-foreground">Click a student to enter or edit their scores</p>
      </div>

      <ResultScoresheetTable :scoresheets="scoresheetsWithProgress" :result-id="resultId" />
    </template>

    <!-- Confirm Delete -->
    <AppConfirmDeleteAction
      v-model:open="openDeleteDialog"
      description="Are you sure you want to delete this result? All scoresheets and scores under it will be lost."
      :confirm-input-text="result?.name"
      @confirm="handleDelete"
    />
  </Page>
</template>
