/* Composables for managing subjects */

export const useListSubjects = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.list.queryOptions({}))
}

export const useCreateSubject = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.subject.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.subject.key() })
    })
  )
}

export const useUpdateSubject = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.subject.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.subject.key() })
    })
  )
}

export const useDeleteSubject = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.subject.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.subject.key() })
    })
  )
}

export const useGetSingleSubject = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.getOne.queryOptions({ input: { id: toValue(id) } }))
}
