/* Composables for managing classes */

export const useListClasses = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.list.queryOptions({}))
}

export const useCreateClass = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.class.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.class.key() })
    })
  )
}

export const useUpdateClass = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.class.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.class.key() })
    })
  )
}

export const useDeleteClass = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.class.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.class.key() })
    })
  )
}

export const useGetSingleClass = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.getOne.queryOptions({ input: { id: toValue(id) } }))
}
