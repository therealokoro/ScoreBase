<script lang="ts" setup>
// Must be rendered as a descendant of <UiSidebarProvider> so that
// useSidebar() can find the context provided by it.
const sidebar = useSidebar()
const nuxtApp = useNuxtApp()

const unhook = nuxtApp.hook("page:finish", () => {
  if (sidebar.isMobile.value) {
    sidebar.setOpenMobile(false)
  }
})

onUnmounted(() => unhook())
</script>

<template>
  <span class="sr-only">Closes the sidebar</span>
</template>
