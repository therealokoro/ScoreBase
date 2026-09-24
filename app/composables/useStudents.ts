/* Composables for managing students */

export const useCreateStudent = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.student.create.mutationOptions())
}

export const useUpdateStudent = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.student.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.student.key() })
    })
  )
}

export const useDeleteStudent = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.student.delete.mutationOptions())
}

export const useGetSingleStudent = (id: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() => $orpc.student.getOne.queryOptions({ input: { id: toValue(id) } }))
  )
}
