/* Composables for the dashboard summary */

export const useAdminDashboardSummary = () => {
  const { $orpc } = useNuxtApp()
  const { isAdmin } = useAuth()
  return useQuery({
    ...$orpc.dashboard.getAdminSummary.queryOptions(),
    enabled: Boolean(isAdmin.value)
  })
}

export const useTeacherDashboardSummary = () => {
  const { $orpc } = useNuxtApp()
  const { isAdmin } = useAuth()
  return useQuery({
    ...$orpc.dashboard.getTeacherSummary.queryOptions(),
    enabled: computed(() => !isAdmin.value)
  })
}
