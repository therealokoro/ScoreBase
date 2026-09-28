import {
  DEFAULT_REPORT_CARD_TEMPLATE,
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_RESULT_SETTINGS
} from "#shared/constants/kv-settings"

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
  const qc = useQueryClient()
  return useMutation(
    $orpc.settings.school.setSettings.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.settings.school.key() })
    })
  )
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
  const qc = useQueryClient()
  return useMutation(
    $orpc.settings.result.setSettings.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.settings.result.key() })
    })
  )
}

/* -------------------------------  Report Card Template  --------------------------------- */

export const useGetReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useQuery({
    ...$orpc.settings.reportCardTemplate.getTemplate.queryOptions(),
    // A function (not the value) stops TanStack treating the placeholder as a cached result;
    // the builder preview renders immediately from defaults while the real template loads.
    placeholderData: () => DEFAULT_REPORT_CARD_TEMPLATE
  })
}

export const useUpdateReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.reportCardTemplate.setTemplate.mutationOptions())
}

export const useResetReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.reportCardTemplate.resetTemplate.mutationOptions())
}

export const useUploadReportCardAsset = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.reportCardTemplate.uploadAsset.mutationOptions())
}
