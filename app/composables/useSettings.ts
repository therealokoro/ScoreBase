import { DEFAULT_SCHOOL_SETTINGS, DEFAULT_RESULT_SETTINGS } from "#shared/constants/kv-settings"

export const useGetSchoolSettings = () => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    $orpc.settings.school.getSettings.queryOptions({
      placeholderData: () => DEFAULT_SCHOOL_SETTINGS
    })
  )
}

export const useUpdateSchoolSettings = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.school.setSettings.mutationOptions())
}

/* -----------------------------------  Result Settings  ------------------------------------------ */
export const useGetResultSettings = () => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    $orpc.settings.result.getSettings.queryOptions({
      placeholderData: () => DEFAULT_RESULT_SETTINGS
    })
  )
}

export const useUpdateResultSettings = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.result.setSettings.mutationOptions())
}
