// composables/useAcademicSession.ts
export const useAcademicSessionList = () => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.academicSession.list.queryOptions({}))
}

export const useAcademicSessionDetail = (id: MaybeRef<string>) => {
  const { $orpc } = useNuxtApp()
  return useQuery($orpc.academicSession.getOne.queryOptions({ input: { id: toValue(id) } }))
}

export const useCreateAcademicSession = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.academicSession.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.academicSession.key() })
    })
  )
}

export const useUpdateAcademicSession = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.academicSession.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.academicSession.key() })
    })
  )
}

export const useDeleteAcademicSession = () => {
  const { $orpc } = useNuxtApp()
  const queryClient = useQueryClient()
  return useMutation(
    $orpc.academicSession.delete.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: $orpc.academicSession.key() })
    })
  )
}
