<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const { isPending, currentUser, signOut } = useAuth()

const adminNavItems = [
  { title: "Dashboard", href: "/#admin", icon: ICONS.dashboard },
  { title: "Sessions", href: "/#admin/sessions", icon: ICONS.session },
  { title: "Classes", href: "/#admin/classes", icon: ICONS.class },
  { title: "Subjects", href: "/#admin/subjects", icon: ICONS.subject },
  { title: "Teachers", href: "/#admin/teachers", icon: ICONS.teacher },
  { title: "Students", href: "/#admin/students", icon: ICONS.students },
  { title: "Results", href: "/#admin/results", icon: ICONS.result },
]

const teacherNavItems = [
  { title: "Dashboard", href: "/#teacher", icon: ICONS.dashboard },
  { title: "My Students", href: "/#teacher/students", icon: ICONS.students },
  { title: "My Results", href: "/#teacher/results", icon: ICONS.result },
]

const currentPath = useRoute().path

async function handleSignOut() {
  await signOut()
  navigateTo("/login")
}
</script>

<template>
  <div>
    <slot />
  </div>
</template>