/* Composables for managing teachers */

export const useListTeachers = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.teacher.list.queryOptions({}))
}

/** Paginated teacher list for the teachers page (server-side paging + search). */
export const useQueryTeachers = (
  params: MaybeRefOrGetter<{ page: number; pageSize: number; search?: string }>
) => {
  const { $orpc } = useNuxtApp()
  return useQuery(computed(() => $orpc.teacher.query.queryOptions({ input: toValue(params) })))
}

export const useCreateTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.key() })
    })
  )
}

export const useUpdateTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.key() })
    })
  )
}

export const useDeleteTeacher = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.teacher.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.teacher.key() })
    })
  )
}

export const useGetSingleTeacher = (id: MaybeRefOrGetter<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    computed(() => $orpc.teacher.getOne.queryOptions({ input: { id: toValue(id) } }))
  )
}
