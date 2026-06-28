<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"
import type { StatCardItem } from "~/components/Dashboard/StatCards.vue"

const { user, isAdmin } = useAuth()

// Admin summary
const adminSummary = useAdminDashboardSummary()
const adminCounts = computed(
  () => adminSummary.data.value?.counts ?? { students: 0, classes: 0, teachers: 0 }
)

const resultStatusCounts = computed(
  () =>
    adminSummary.data.value?.resultStatusCounts ?? {
      draft: 0,
      submitted: 0,
      reviewed: 0,
      published: 0
    }
)

// Teacher summary — only fetched when the user isn't an admin (useTeacherDashboardSummary
// disables itself for admins to avoid an unnecessary round trip).
const teacherSummary = useTeacherDashboardSummary()
const teacherClass = computed(() => teacherSummary.data.value?.class ?? null)
const teacherResult = computed(() => teacherSummary.data.value?.result ?? null)

// Active session/term comes from whichever summary is actually active for this role.
const activeSession = computed(
  () =>
    (isAdmin.value
      ? adminSummary.data.value?.activeSession
      : teacherSummary.data.value?.activeSession) ?? null
)
const activeTerm = computed(
  () =>
    (isAdmin.value ? adminSummary.data.value?.activeTerm : teacherSummary.data.value?.activeTerm) ??
    null
)
const activeTermLabel = computed(() => {
  if (!activeSession.value || !activeTerm.value) return "Not set"
  return `${activeSession.value.name} - ${activeTerm.value.name}`
})

const resultsSectionTitle = computed(() => {
  if (!activeSession.value || !activeTerm.value) return "Active Result Summary — no active term set"
  return `Active Result Summary — ${activeSession.value.name} - ${activeTerm.value.name}`
})

const adminStats = computed<StatCardItem[]>(() => [
  {
    key: "students",
    label: "Students",
    value: adminCounts.value.students,
    icon: ICONS.students,
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    key: "classes",
    label: "Classes",
    value: adminCounts.value.classes,
    icon: ICONS.class,
    classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
  },
  {
    key: "teachers",
    label: "Teachers",
    value: adminCounts.value.teachers,
    icon: ICONS.teacher,
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  },
  {
    key: "active",
    label: "Active Session/Term",
    value: activeTermLabel.value,
    icon: ICONS.session,
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    wide: true
  }
])

const teacherStats = computed<StatCardItem[]>(() => [
  {
    key: "class",
    label: "My Class",
    value: teacherClass.value?.name ?? "Not assigned",
    icon: ICONS.class,
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    key: "students",
    label: "Students in Class",
    value: teacherClass.value?.studentCount ?? 0,
    icon: ICONS.students,
    classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
  },
  {
    key: "active",
    label: "Active Session/Term",
    value: activeTermLabel.value,
    icon: ICONS.session,
    wide: true,
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  }
])

const isPending = computed(() =>
  isAdmin.value ? adminSummary.isPending.value : teacherSummary.isPending.value
)
const error = computed(() =>
  isAdmin.value ? adminSummary.error.value : teacherSummary.error.value
)
</script>

<template>
  <Page
    title="Overview"
    :description="`Welcome back, ${user.name}`"
    :loading="isPending"
    :error="error"
  >
    <div class="grid w-full gap-6">
      <!-- Admin-only summary -->
      <template v-if="isAdmin">
        <DashboardStatCards :stats="adminStats" />
        <DashboardResultsPipeline :title="resultsSectionTitle" :counts="resultStatusCounts" />
      </template>

      <!-- Teacher summary — scoped to their own class only -->
      <template v-else>
        <DashboardStatCards :stats="teacherStats" />

        <div v-if="teacherResult" class="flex">
          <UiButton :to="`/dashboard/results/${teacherResult.id}`" :icon="ICONS.result">
            {{ teacherResult.status === "draft" ? "Continue scoresheet" : "View result" }}
          </UiButton>
        </div>
      </template>
    </div>
  </Page>
</template>
