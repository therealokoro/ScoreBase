<script setup lang="ts">
import { ICONS } from "#shared/constants/icons"
import { useSidebar } from "~/components/ui/sidebar"

const { toggleSidebar } = useSidebar()
</script>

<template>
  <button
    class="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-muted hover:text-foreground"
    @click="toggleSidebar"
  >
    <Icon :name="ICONS.menu" class="size-5" />
    <span class="sr-only">Toggle Sidebar</span>
  </button>
</template>