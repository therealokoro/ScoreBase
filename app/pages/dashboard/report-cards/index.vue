<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

useSeoMeta({ title: "Report Cards | ScoreBase" })
</script>

<template>
  <Page title="Report Cards" description="Customize how printed report cards look for your school">
    <UiCard class="max-w-95">
      <UiCardHeader>
        <UiCardTitle class="flex items-center gap-2 text-base">
          <Icon :name="ICONS.document" class="text-primary size-4" />
          Report Card Builder
        </UiCardTitle>
        <UiCardDescription>
          Customize the layout, columns, and content of printed report cards.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <UiButton :icon="ICONS.settings" to="/dashboard/report-cards/builder">
          Open the builder
        </UiButton>
      </UiCardContent>
    </UiCard>
  </Page>
</template>
