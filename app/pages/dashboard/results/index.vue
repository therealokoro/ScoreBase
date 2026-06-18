<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
</script>

<template>
  <Page title="Results" description="Manage results across sessions and terms">
    <div class="w-full space-x-3">
      <ui-button :icon="ICONS.add">Create New Result</ui-button>
      <ui-button variant="outline" :icon="ICONS.result">Load a Result</ui-button>
      <ui-button to="/dashboard/results/settings" variant="outline" :icon="ICONS.settings">
        Result Settings
      </ui-button>
    </div>

    <AppContentPlaceholder
      title="View Result"
      text='Use the "Load a Result" button above to open a result'
    />
  </Page>
</template>
