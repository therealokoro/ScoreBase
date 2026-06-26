/* Composable for the admin dashboard summary */

export const useAdminDashboardSummary = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.dashboard.getAdminSummary.queryOptions())
}
