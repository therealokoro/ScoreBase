<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const props = withDefaults(defineProps<{ isAdmin?: boolean }>(), { isAdmin: false })

const { isPending, currentUser, signOut } = useAuth()

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: ICONS.dashboard },
  { title: "Sessions", href: "/admin/sessions", icon: ICONS.session },
  { title: "Classes", href: "/admin/classes", icon: ICONS.class },
  { title: "Subjects", href: "/admin/subjects", icon: ICONS.subject },
  { title: "Teachers", href: "/admin/teachers", icon: ICONS.teacher },
  { title: "Students", href: "/admin/students", icon: ICONS.students },
  { title: "Results", href: "/#admin/results", icon: ICONS.result }
]

const teacherNavItems = [
  { title: "Overview", href: "/teacher", icon: ICONS.dashboard },
  { title: "My Class", href: "/teacher/class", icon: ICONS.students },
  { title: "My Results", href: "/#teacher/results", icon: ICONS.result }
]

async function handleSignOut() {
  await signOut()
  navigateTo("/login")
}

// const isAdmin = computed(() => currentUser.value && currentUser.value.role == "admin")
const sidebarContents = computed(() => {
  return {
    navItems: props.isAdmin ? adminNavItems : teacherNavItems,
    userIcon: props.isAdmin ? ICONS.admin : ICONS.teacher,
    userColor: props.isAdmin ? "bg-primary" : "bg-gray-800"
  }
})
</script>

<template>
  <UiSidebarProvider>
    <UiSidebar side="left" class="border-r">
      <!-- Sidebar Header -->
      <UiSidebarHeader class="flex flex-col gap-2 p-3">
        <div class="flex items-center gap-3 px-2 py-1.5">
          <div
            class="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Icon :name="ICONS.school" />
          </div>

          <div class="grid flex-1">
            <span class="font-semibold text-sm">ScoreBase</span>
            <span class="text-xs text-muted-foreground">Result Management</span>
          </div>
        </div>
      </UiSidebarHeader>

      <!-- Sidebar Content -->
      <UiSidebarContent class="p-2">
        <UiSidebarMenu>
          <UiSidebarMenuItem v-for="item in sidebarContents.navItems" :key="item.href">
            <UiSidebarMenuButton
              as-child
              :is-active="
                $route.path === item.href ||
                (item.href !== '/admin' && $route.path.startsWith(item.href))
              "
            >
              <NuxtLink :to="item.href" class="nav-item">
                <Icon :name="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarContent>

      <!-- Sidebar Footer -->
      <UiSidebarFooter class="border-t p-2 mt-auto">
        <UiSkeleton class="w-full h-30" v-if="isPending && !currentUser" />

        <div v-else-if="currentUser" class="flex flex-col gap-2">
          <UiSidebarMenu>
            <!-- Settings Route -->
            <UiSidebarMenuItem>
              <UiSidebarMenuButton as-child>
                <NuxtLink to="/#settings" class="nav-item">
                  <Icon :name="ICONS.settings" />
                  <span>Settings</span>
                </NuxtLink>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>

            <!-- Sign Out Button -->
            <UiSidebarMenuItem>
              <UiSidebarMenuButton @click="handleSignOut" class="nav-item">
                <Icon :name="ICONS.logout" />
                <span>Sign out</span>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
          </UiSidebarMenu>

          <!-- Users Info -->
          <div class="flex items-center gap-3 rounded-md bg-muted/50 p-2">
            <div
              class="flex size-9 items-center justify-center rounded-full"
              :class="sidebarContents.userColor"
            >
              <Icon :name="sidebarContents.userIcon" class="text-primary-foreground" />
            </div>
            <div class="grid flex-1">
              <span class="truncate text-sm font-medium">{{ currentUser.name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ currentUser.email }}</span>
            </div>
          </div>
        </div>
      </UiSidebarFooter>

      <!-- Sidebar Rail -->
      <UiSidebarRail />
    </UiSidebar>

    <!-- Main Page content -->
    <UiSidebarInset>
      <header class="sticky top-0 w-full h-14 z-10 bg-background border-b">
        <UiContainer class="flex h-full shrink-0 items-center gap-4">
          <UiSidebarTrigger />
        </UiContainer>
      </header>

      <UiContainer class="py-7">
        <slot />
      </UiContainer>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<style lang="css">
@reference "../assets/css/tailwind.css";

.nav-item {
  @apply flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:text-foreground;
}
</style>
