<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const props = defineProps<{
  students: number
  classes: number
  teachers: number
  activeSessionName: string | null
  activeTermName: string | null
}>()

const activeLabel = computed(() => {
  if (!props.activeSessionName || !props.activeTermName) return "Not set"
  return `${props.activeSessionName} - ${props.activeTermName}`
})

// Drives the v-for below — each entry maps directly to one of the repeated
// stat cards. Add/remove a stat by editing this array only.
const stats = computed(() => [
  {
    key: "students",
    label: "Students",
    value: props.students,
    icon: ICONS.students,
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    key: "classes",
    label: "Classes",
    value: props.classes,
    icon: ICONS.class,
    classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
  },
  {
    key: "teachers",
    label: "Teachers",
    value: props.teachers,
    icon: ICONS.teacher,
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  }
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5"
    >
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-full"
        :class="stat.classes"
      >
        <Icon :name="stat.icon" class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
        <p class="text-xl font-semibold leading-tight">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Active Session/Term spans 2 columns on lg — needs more room to show
         both names without truncating as aggressively as a single-column
         card would force. -->
    <div
      class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5 sm:col-span-2 lg:col-span-2"
    >
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        <Icon :name="ICONS.session" class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-muted-foreground">Active Session/Term</p>
        <p class="text-base font-semibold leading-tight truncate" :title="activeLabel">
          {{ activeLabel }}
        </p>
      </div>
    </div>
  </div>
</template>
