/* Composables for managing teachers */

export const useListTeachers = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.teacher.list.queryOptions({}))
}

export const useCreateTeacher = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.teacher.create.mutationOptions())
}

export const useUpdateTeacher = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.teacher.update.mutationOptions())
}

export const useDeleteTeacher = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.teacher.delete.mutationOptions())
}

export const useGetSingleTeacher = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.teacher.getOne.queryOptions({ input: { id: toValue(id) } }))
}
