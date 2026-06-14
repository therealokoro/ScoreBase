<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
</script>

<template>
  <Page title="Results" description="Manage results across sessions and terms">
    <div class="w-full space-x-3">
      <ui-button :icon="ICONS.add">Create New Result</ui-button>
      <ui-button variant="outline" :icon="ICONS.result">Load a Result</ui-button>
    </div>
  </Page>
</template>
