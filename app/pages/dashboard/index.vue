<script lang="ts" setup>
const { user, isAdmin } = useAuth()
const { data, isPending, error } = useAdminDashboardSummary()

const counts = computed(() => data.value?.counts ?? { students: 0, classes: 0, teachers: 0 })
const activeSession = computed(() => data.value?.activeSession ?? null)
const activeTerm = computed(() => data.value?.activeTerm ?? null)
const resultStatusCounts = computed(
  () => data.value?.resultStatusCounts ?? { draft: 0, submitted: 0, reviewed: 0, published: 0 }
)
const recentActivity = computed(() => data.value?.recentActivity ?? [])

// "Results — [session] - [term]" — falls back to a neutral label when no
// active session/term has been configured yet in school settings, rather
// than showing "Results — null - null".
const resultsSectionTitle = computed(() => {
  if (!activeSession.value || !activeTerm.value) return "Results Status — no active term set"
  return `Results Status — ${activeSession.value.name} - ${activeTerm.value.name}`
})
</script>

<template>
  <Page
    title="Overview"
    :description="`Welcome back, ${user?.name}`"
    :loading="isPending"
    :error="error"
  >
    <div class="grid w-full gap-4">
      <!-- Admin-only summary -->
      <template v-if="isAdmin">
        <DashboardStatCards
          :students="counts.students"
          :classes="counts.classes"
          :teachers="counts.teachers"
          :active-session-name="activeSession?.name ?? null"
          :active-term-name="activeTerm?.name ?? null"
        />

        <div class="flex flex-col sm:flex-row gap-4">
          <DashboardResultsPipeline :title="resultsSectionTitle" :counts="resultStatusCounts" />
          <DashboardRecentActivities :items="recentActivity" />
        </div>
      </template>
    </div>
  </Page>
</template>
