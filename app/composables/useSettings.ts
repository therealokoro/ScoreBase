export const useGetSchoolSettings = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.settings.school.getSettings.queryOptions())
}

export const useUpdateSchoolSettings = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.school.setSettings.mutationOptions())
}

/* -----------------------------------  Result Settings  ------------------------------------------ */
export const useGetResultSettings = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.settings.result.getSettings.queryOptions())
}

export const useUpdateResultSettings = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.result.setSettings.mutationOptions())
}
