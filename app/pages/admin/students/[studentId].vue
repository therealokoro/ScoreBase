<script lang="ts" setup>
const route = useRoute()
const studentId = route.params.studentId as string
const { data, isPending, error, refetch } = useGetSingleStudent(studentId)
const student = computed(() => data.value)

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
      navigateTo("/admin/students")
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
  <Page :title="student?.name || 'Loading...'" :loading="isPending" :error="error ?? undefined">
    <template #actions>
      <div class="space-x-2">
        <AppEntityActionDropdown
          @edit="() => (openEditSheet = true)"
          @delete="() => (openDeleteDialog = true)"
        />
      </div>
    </template>

    <!-- Content -->
    <div v-if="student">
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
                :to="`/admin/classes/${student.class.id}`"
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
