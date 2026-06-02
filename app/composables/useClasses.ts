/* Composables for managing classes */

export const useListClasses = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.list.queryOptions({}))
}

export const useCreateClass = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.class.create.mutationOptions())
}

export const useUpdateClass = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.class.update.mutationOptions())
}

export const useDeleteClass = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.class.delete.mutationOptions())
}

export const useGetSingleClass = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.class.getOne.queryOptions({ input: { id: toValue(id) } }))
}

export const useSetClassSubjectList = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.class.setSubjectList.mutationOptions())
}
