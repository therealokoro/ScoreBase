// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export const useListResults = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.result.list.queryOptions())
}

export const useGetResultByTerm = (termId: MaybeRefOrGetter<string | null>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() => {
      const id = toValue(termId)
      return $orpc.result.getByTerm.queryOptions({
        input: { termId: id ?? "" },
        enabled: false
      })
    })
  )
}

export const useGetResult = (id: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(computed(() => $orpc.result.getOne.queryOptions({ input: { id: toValue(id) } })))
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
  const qc = useQueryClient()
  return useMutation(
    $orpc.result.updateStatus.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
      }
    })
  )
}

export const useUpdateResultScoreConfig = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.result.updateScoreConfig.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
      }
    })
  )
}

export const useDeleteResult = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.result.delete.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
      }
    })
  )
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
  const qc = useQueryClient()
  return useMutation(
    $orpc.scoresheet.createScoresheets.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

export const useUpdateScoresheetRemarks = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.scoresheet.updateScoresheetRemarks.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

// ---------------------------------------------------------------------------
// Subject Scores
// ---------------------------------------------------------------------------

export const useAddSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectScore.addSubjectScore.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

export const useRemoveSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectScore.removeSubjectScore.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

export const useUpdateSubjectScore = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectScore.updateSubjectScore.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

export const useBulkUpdateSubjectScores = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectScore.bulkUpdateSubjectScores.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: $orpc.scoresheet.key() })
        qc.invalidateQueries({ queryKey: $orpc.result.key() })
      }
    })
  )
}

export const useGetReportCard = (scoresheetId: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() =>
      $orpc.scoresheet.getReportCard.queryOptions({
        input: { id: toValue(scoresheetId) }
      })
    )
  )
}
