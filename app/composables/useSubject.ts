/* Composables for managing subjects */

export const useListSubjects = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.list.queryOptions({}))
}

export const useCreateSubject = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subject.create.mutationOptions())
}

export const useUpdateSubject = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subject.update.mutationOptions())
}

export const useDeleteSubject = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subject.delete.mutationOptions())
}

export const useGetSingleSubject = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.subject.getOne.queryOptions({ input: { id: toValue(id) } }))
}

/* Subject List Composables */
export const useCreateSubjectList = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectList.create.mutationOptions())
}

export const useUpdateSubjectList = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectList.update.mutationOptions())
}

export const useDeleteSubjectList = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.subjectList.delete.mutationOptions())
}
