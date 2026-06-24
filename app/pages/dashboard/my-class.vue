<script lang="ts" setup>
import type { StatsCardProps } from "~/components/App/StatsCard.vue"
import { ICONS } from "~~/shared/constants/icons"

definePageMeta({ middleware: ["teacher-only"] })

const { currentUser, isPending } = useAuth()

const { $orpc } = useNuxtApp()
const queryKey = computed(() => `${currentUser.value?.id}-class-fetch`)
const { data, pending, refresh } = await useAsyncData(queryKey, () => {
  return $orpc.teacher.getClass.call({ teacherId: currentUser.value!.id })
})

const currClass = computed(() => data.value)

// Dynamically set the breadcrumb label once data is loaded
setPageBreadcrumbLabel(computed(() => currClass.value?.name))

// Placeholder class stats info
const classStats = computed<StatsCardProps[]>(() => {
  return [
    {
      label: "Total Students",
      value: currClass.value?.count.students || "0",
      icon: ICONS.students as string
    },
    { label: "Total Results", value: "15", icon: ICONS.result as string }
  ]
})

const isSheetOpen = ref(false)
const updateClass = useUpdateClass()

function handleUpdateClass(payload: any) {
  useSonner.promise(updateClass.mutateAsync(payload), {
    loading: "Updating class info...",
    success: () => {
      refresh()
      isSheetOpen.value = false
      return "Class was updated successfully"
    },
    error: (err: any) => err.message
  })
}
</script>

<template>
  <Page
    :title="currClass?.name || 'No Class'"
    :loading="isPending || pending"
    :badge="currClass ? `Teacher: ${currClass.teacher?.name}` : undefined"
  >
    <AppContentPlaceholder
      v-if="!currClass"
      title="Oops, No Class"
      text="Looks like you haven't been assigned to any class. Contact your admin to assign a class to you"
    />

    <!-- When the teacher has a class -->
    <template v-else>
      <!-- Class Stats and Subject List View -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Show class subject list preset -->
        <ClassSubjectPresetControl
          v-if="currClass"
          :active-class="currClass"
          @onMutation="() => refresh()"
        />

        <!-- Show class stats -->
        <ClassStatsCard v-for="item in classStats" v-bind="item" />
      </div>

      <!-- Render students in a table -->
      <StudentListTable :class-id="currClass?.id" :show-create-button="true" />
    </template>

    <!-- currClass Edit Form -->
    <LazyClassUpsertForm
      v-if="currClass && isSheetOpen"
      :key="isSheetOpen.toString()"
      mode="Edit"
      @submit="handleUpdateClass"
      :initial-data="currClass"
      v-model:open="isSheetOpen"
    />
  </Page>
</template>
