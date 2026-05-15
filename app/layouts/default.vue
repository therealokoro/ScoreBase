<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'

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
  <SidebarProvider>
    <Sidebar side="left" collapsible="icon" class="border-r">
      <SidebarHeader class="flex flex-col gap-2 p-3">
        <div class="flex items-center gap-3 px-2 py-1.5">
          <div class="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon :name="ICONS.school" class="size-5 shrink-0" />
          </div>
          <div class="grid flex-1 truncate group-data-[collapsible=icon]:hidden">
            <span class="font-semibold text-sm">ScoreBase</span>
            <span class="text-xs text-muted-foreground">Result Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent class="mt-2 px-2">
        <SidebarMenu>
          <SidebarMenuItem v-for="item in adminNavItems" :key="item.href">
            <SidebarMenuButton
              as-child
              :is-active="currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href))"
            >
              <NuxtLink :to="item.href" class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:text-foreground">
                <Icon :name="item.icon" class="size-5 shrink-0" />
                <span class="truncate group-data-[collapsible=icon]:hidden">{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter class="border-t p-3 mt-auto">
        <div v-if="!isPending && currentUser" class="flex flex-col gap-2">
          <div class="flex items-center gap-3 rounded-md bg-muted/50 p-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Icon :name="ICONS.admin" class="size-4 text-muted-foreground" />
            </div>
            <div class="grid flex-1 truncate">
              <span class="truncate text-sm font-medium">{{ currentUser.name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ currentUser.email }}</span>
            </div>
          </div>
          <button
            @click="handleSignOut"
            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon :name="ICONS.logout" class="size-4" />
            <span class="group-data-[collapsible=icon]:hidden">Sign out</span>
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-14 shrink-0 items-center border-b px-4">
        <SidebarTrigger />
      </header>

      <div class="flex flex-1 flex-col gap-4 p-4">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>