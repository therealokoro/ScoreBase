<script lang="ts" setup>
const route = useRoute()
const studentId = route.params.studentId as string
const { data, isPending, error, refetch } = useGetSingleStudent(studentId)
const student = computed(() => data.value)

const auth = useAuth()
const isUserAdmin = computed(() => auth.currentUser.value?.role == "admin")

// Set breadcrumb label
setPageBreadcrumbLabel(computed(() => student.value?.name))

// Mutations
const updateStudent = useUpdateStudent()
const deleteStudent = useDeleteStudent()

// Form state
const openEditSheet = ref(false)
const openDeleteDialog = ref(false)

// Handle form submission
const handleStudentSubmit = async (studentData: any) => {
  useSonner.promise(updateStudent.mutateAsync({ ...studentData }), {
    loading: "Updating student, please wait...",
    success: () => {
      refetch()
      openEditSheet.value = false
      return "Student updated successfully"
    },
    error: (e: any) => e.message
  })
}

// Handle delete
const handleDelete = async () => {
  if (!studentId) return
  useSonner.promise(deleteStudent.mutateAsync({ id: studentId }), {
    loading: "Deleting student, please wait...",
    success: () => {
      navigateTo("/dashboard/students")
      return "Student deleted successfully"
    },
    error: (e: any) => e.message
  })
}

// Close sheets/dialogs
const closeAll = () => {
  openEditSheet.value = false
  openDeleteDialog.value = false
}
</script>

<template>
  <Page :title="student?.name || 'Loading...'" :error="error ?? undefined">
    <template #actions>
      <div class="space-x-2">
        <AppEntityActionDropdown
          @edit="() => (openEditSheet = true)"
          @delete="() => (openDeleteDialog = true)"
        />
      </div>
    </template>

    <!-- Loading Skeleton -->
    <div v-if="isPending && !student" class="w-full">
      <div class="w-full space-y-3">
        <UiSkeleton class="w-full h-7" />
        <UiSkeleton class="w-full h-5" />
      </div>
      <div class="w-full space-y-3">
        <UiSkeleton v-for="n in 5" class="w-full h-7" />
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="student">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle title="Student Information" />
          <UiCardDescription
            description="A summary of the student's personal details and enrollment information"
          />
        </UiCardHeader>
        <UiCardContent>
          <UiDescriptionList>
            <UiDescriptionListTerm>Name</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ student.name }}</UiDescriptionListDetails>

            <UiDescriptionListTerm>Student ID</UiDescriptionListTerm>
            <UiDescriptionListDetails>
              {{ student.studentId || "Not assigned" }}
            </UiDescriptionListDetails>

            <UiDescriptionListTerm>Class</UiDescriptionListTerm>
            <UiDescriptionListDetails>
              <ui-button
                v-if="student.class"
                variant="link"
                :to="isUserAdmin ? `/dashboard/classes/${student.class.id}` : '/dashboard/my-class'"
                title="Click to view class"
              >
                {{ student.class.name }}
              </ui-button>
              <span v-else>Unassigned</span>
            </UiDescriptionListDetails>

            <UiDescriptionListTerm>Phone Number</UiDescriptionListTerm>
            <UiDescriptionListDetails>
              {{ student.phoneNumber || "Not provided" }}
            </UiDescriptionListDetails>

            <UiDescriptionListTerm>Created At</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ formatDate(student.createdAt) }}</UiDescriptionListDetails>
          </UiDescriptionList>
        </UiCardContent>
      </UiCard>
    </div>

    <!-- Edit Form Sheet -->
    <StudentUpsertForm
      v-if="student"
      mode="Edit"
      :key="student.updatedAt.toString()"
      v-model:open="openEditSheet"
      :initial-data="student"
      @submit="handleStudentSubmit"
      @close="closeAll"
    />

    <!-- Delete Confirmation -->
    <AppConfirmDeleteAction
      v-if="student"
      :description="`Are you sure you want to delete ${student.name}?`"
      v-model:open="openDeleteDialog"
      :confirm-input-text="student?.name"
      @confirm="handleDelete"
    />
  </Page>
</template>
