// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export const useListResults = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.result.list.queryOptions())
}

export const useGetResult = (id: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() =>
      $orpc.result.getOne.queryOptions({
        input: { id: toValue(id) }
      })
    )
  )
}

export const useCreateResult = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.result.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.result.key() })
    })
  )
}

export const useUpdateResultStatus = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.result.updateStatus.mutationOptions())
}

export const useUpdateResultScoreConfig = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.result.updateScoreConfig.mutationOptions())
}

export const useDeleteResult = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.result.delete.mutationOptions())
}

// ---------------------------------------------------------------------------
// Scoresheets
// ---------------------------------------------------------------------------

export const useGetScoresheet = (id: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() =>
      $orpc.scoresheet.getOneScoresheet.queryOptions({
        input: { id: toValue(id) }
      })
    )
  )
}

export const useCreateScoresheets = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.scoresheet.createScoresheets.mutationOptions())
}

export const useUpdateScoresheetRemarks = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.scoresheet.updateScoresheetRemarks.mutationOptions())
}

// ---------------------------------------------------------------------------
// Subject Scores
// ---------------------------------------------------------------------------

export const useAddSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectScore.addSubjectScore.mutationOptions())
}

export const useRemoveSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectScore.removeSubjectScore.mutationOptions())
}

export const useUpdateSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectScore.updateSubjectScore.mutationOptions())
}

export const useBulkUpdateSubjectScores = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectScore.bulkUpdateSubjectScores.mutationOptions())
}
