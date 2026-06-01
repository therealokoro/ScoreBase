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

export const useGetSingleStudent = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.student.getOne.queryOptions({ input: { id: toValue(id) } }))
}

export const useQueryStudents = (
  pagination: MaybeRef<{ pageIndex: number; pageSize: number; search?: string }>
) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    $orpc.student.query.queryOptions({
      queryKey: computed(() => ["students", toValue(pagination)]).value,
      input: {
        page: toValue(pagination).pageIndex,
        pageSize: toValue(pagination).pageSize,
        search: toValue(pagination).search || undefined
      }
    })
  )
}
