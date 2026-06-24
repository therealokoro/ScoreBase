/* Composables for managing classes */

export const useListClasses = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.list.queryOptions({}))
}

export const useCreateClass = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.class.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.class.list.queryKey() })
    })
  )
}

export const useUpdateClass = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.class.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.class.list.queryKey() })
    })
  )
}

export const useDeleteClass = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.class.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.class.list.queryKey() })
    })
  )
}

export const useGetSingleClass = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.getOne.queryOptions({ input: { id: toValue(id) } }))
}

export const useSetClassSubjectList = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.class.setSubjectList.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.class.key() })
    })
  )
}
