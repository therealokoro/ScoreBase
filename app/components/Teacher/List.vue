<script lang="ts" setup>
const props = defineProps<{ teachers: ITeacher[] }>()

defineEmits(["edit", "delete"])
</script>

<template>
  <div class="grid overflow-x-auto border rounded-lg">
    <UiTable>
      <UiTableHeader>
        <UiTableRow class="font-semibold">
          <UiTableHead>Name</UiTableHead>
          <UiTableHead class="hidden sm:table-cell">Email Address</UiTableHead>
          <UiTableHead>Class</UiTableHead>
          <UiTableHead class="hidden sm:table-cell">Phone Number</UiTableHead>
          <UiTableHead class="hidden sm:table-cell">Registered</UiTableHead>
          <UiTableHead>
            <span class="sr-only">Actions</span>
          </UiTableHead>
        </UiTableRow>
      </UiTableHeader>

      <UiTableBody>
        <template v-for="teacher in teachers" :key="teacher.id">
          <UiTableRow>
            <UiTableCell>
              <div class="flex flex-col gap-1">
                <button
                  @click="$emit('edit', teacher)"
                  class="line-clamp w-max font-medium underline underline-offset-4"
                >
                  {{ teacher.name }}
                </button>
                <p class="line-clamp-1 text-xs text-muted-foreground sm:hidden">
                  {{ teacher.email }}
                </p>
              </div>
            </UiTableCell>

            <UiTableCell class="hidden sm:table-cell">{{ teacher.email }}</UiTableCell>

            <UiTableCell>
              <ui-badge
                v-if="teacher.class"
                variant="outline"
                :to="`/admin/classes/${teacher.class.id}`"
              >
                {{ teacher.class.name }}
              </ui-badge>
              <ui-badge v-else variant="secondary">Un assigned</ui-badge>
            </UiTableCell>

            <UiTableCell class="hidden sm:table-cell">{{ teacher.phoneNumber }}</UiTableCell>

            <UiTableCell class="hidden sm:table-cell">
              {{ formatDate(teacher.createdAt) }}
            </UiTableCell>

            <UiTableCell class="text-right">
              <AppEntityActionDropdown
                @edit="$emit('edit', teacher)"
                @delete="$emit('delete', teacher)"
              />
            </UiTableCell>
          </UiTableRow>
        </template>
      </UiTableBody>
    </UiTable>
  </div>
</template>
