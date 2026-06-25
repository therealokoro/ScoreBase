<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

const { isPending, currentUser, signOut } = useAuth()

const adminNavItems = [
  { title: "Overview", href: "/dashboard", icon: ICONS.dashboard },
  { title: "Sessions", href: "/dashboard/sessions", icon: ICONS.session },
  { title: "Classes", href: "/dashboard/classes", icon: ICONS.class },
  { title: "Subjects", href: "/dashboard/subjects", icon: ICONS.subject },
  { title: "Teachers", href: "/dashboard/teachers", icon: ICONS.teacher },
  { title: "Students", href: "/dashboard/students", icon: ICONS.students },
  { title: "Results", href: "/dashboard/results", icon: ICONS.result }
]

const teacherNavItems = [
  { title: "Overview", href: "/dashboard", icon: ICONS.dashboard },
  { title: "My Class", href: "/dashboard/my-class", icon: ICONS.students },
  { title: "My Results", href: "/dashboard/results", icon: ICONS.result }
]

async function handleSignOut() {
  await signOut()
  navigateTo("/")
}

const isAdmin = computed(() => currentUser.value && currentUser.value.role == "admin")
const sidebarContents = computed(() => {
  return {
    navItems: isAdmin.value ? adminNavItems : teacherNavItems,
    userIcon: isAdmin.value ? ICONS.admin : ICONS.teacher,
    userColor: isAdmin.value ? "bg-primary" : "bg-gray-800"
  }
})
</script>

<template>
  <UiSidebarProvider>
    <UiSidebar side="left" class="border-r">
      <!-- Sidebar Header -->
      <UiSidebarHeader class="flex flex-col gap-2 p-3">
        <NuxtLink
          to="/dashboard"
          class="rounded-lg hover:bg-muted flex items-center gap-3 px-2 py-1.5"
        >
          <AppLogo class="size-10" />
          <div class="grid flex-1">
            <span class="text-lg font-extrabold">ScoreBase</span>
            <!-- <span class="text-xs text-muted-foreground">Brilliance College</span> -->
          </div>
        </NuxtLink>
      </UiSidebarHeader>

      <!-- Sidebar Content -->
      <UiSidebarContent class="p-2">
        <template v-if="isPending">
          <UiSidebarMenuSkeleton v-for="n in 5" />
        </template>
        <UiSidebarMenu v-else>
          <UiSidebarMenuItem v-for="item in sidebarContents.navItems" :key="item.href">
            <UiSidebarMenuButton
              as-child
              :is-active="
                $route.path === item.href ||
                (item.href !== '/dashboard' && $route.path.startsWith(item.href))
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
        <div v-if="isPending && !currentUser" class="space-y-3">
          <UiSidebarMenuSkeleton v-for="n in 2" class="w-full h-6" />
          <UiSidebarMenuSkeleton class="w-full h-10" />
        </div>
        <div v-else-if="currentUser" class="flex flex-col gap-2">
          <UiSidebarMenu>
            <!-- Settings Route -->
            <UiSidebarMenuItem>
              <UiSidebarMenuButton
                as-child
                :is-active="$route.path.startsWith('/dashboard/settings')"
              >
                <NuxtLink to="/dashboard/settings/account" class="nav-item">
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

      <!-- Closes the sidebar on every navigation for mobile -->
      <SidebarMobileCloser />
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
