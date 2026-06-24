<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const commonNav = [
  { title: "Account", icon: ICONS.student, link: "/dashboard/settings/account" },
  { title: "Security", icon: ICONS.security, link: "/dashboard/settings/security" }
]

const adminNav = { title: "School", icon: ICONS.school, link: "/dashboard/settings/school" }

const auth = useAuth()
const navList = computed(() => {
  const user = auth.currentUser.value as typeof auth.currentUser.value & { role?: string }
  if (user?.role === "admin") return [...commonNav, adminNav]
  return commonNav
})
</script>

<template>
  <Page
    title="Settings"
    description="Update and manage your account's information and other settings"
  >
    <div class="flex flex-col w-full gap-5 md:flex-row md:gap-10">
      <UiList class="flex flex-row gap-1 border p-1 rounded-lg md:flex-col md:max-w-50 md:border-0">
        <template v-for="n in navList" :key="n.title">
          <UiListItem
            :to="n.link"
            :class="[
              'rounded-lg px-3 flex-center md:px-4 md:justify-start',
              $route.path === n.link && 'bg-muted'
            ]"
          >
            <Icon :name="n.icon" class="md:size-5" />
            <UiListContent>
              <UiListTitle :title="n.title" class="text-sm font-medium" />
            </UiListContent>
          </UiListItem>
        </template>
      </UiList>

      <div class="flex-1">
        <NuxtPage />
      </div>
    </div>
  </Page>
</template>
