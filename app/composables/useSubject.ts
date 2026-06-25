/* Composables for managing subjects */

export const useListSubjects = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.list.queryOptions({}))
}

export const useCreateSubject = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subject.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subject.list.queryKey() })
    })
  )
}

export const useUpdateSubject = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subject.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subject.list.queryKey() })
    })
  )
}

export const useDeleteSubject = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subject.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subject.list.queryKey() })
    })
  )
}

export const useGetSingleSubject = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.getOne.queryOptions({ input: { id: toValue(id) } }))
}

/* Subject List Composables */

export const useFetchSubjectLists = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subjectList.list.queryOptions({}))
}

export const useCreateSubjectList = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectList.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subjectList.list.key() })
    })
  )
}

export const useUpdateSubjectList = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectList.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subjectList.list.key() })
    })
  )
}

export const useDeleteSubjectList = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.subjectList.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.subjectList.list.key() })
    })
  )
}
