/* Composables for managing teachers */

export const useListTeachers = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.teacher.list.queryOptions({}))
}

export const useCreateTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.list.queryKey() })
    })
  )
}

export const useUpdateTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.list.queryKey() })
    })
  )
}

export const useDeleteTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.list.queryKey() })
    })
  )
}

export const useGetSingleTeacher = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.teacher.getOne.queryOptions({ input: { id: toValue(id) } }))
}
