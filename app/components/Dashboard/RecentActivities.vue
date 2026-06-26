<script lang="ts" setup>
import { ICONS } from "#shared/constants/icons"

type ActivityItem = {
  id: string
  resultName: string
  status: "draft" | "submitted" | "reviewed" | "published"
  actorName: string | null
  occurredAt: string
}

defineProps<{ items: ActivityItem[] }>()

const STATUS_META: Record<
  ActivityItem["status"],
  { verb: string; icon: string; dotClasses: string }
> = {
  draft: { verb: "created", icon: ICONS.document, dotClasses: "bg-muted-foreground/40" },
  submitted: { verb: "submitted", icon: ICONS.pending, dotClasses: "bg-amber-500" },
  reviewed: { verb: "reviewed", icon: ICONS.approve, dotClasses: "bg-blue-500" },
  published: { verb: "published", icon: ICONS.publish, dotClasses: "bg-emerald-500" }
}
</script>

<template>
  <div class="flex-1 rounded-lg border bg-card p-4">
    <div class="flex items-center gap-2 mb-4">
      <Icon :name="ICONS.history" class="size-4" />
      <p class="text-sm font-semibold">Recent activity</p>
    </div>

    <UiEmpty
      v-if="!items.length"
      title="No activity yet"
      description="Result submissions and reviews will show up here"
    />

    <div v-else class="space-y-1">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 hover:bg-muted/50 transition-colors"
      >
        <span class="size-2 shrink-0 rounded-full" :class="STATUS_META[item.status].dotClasses" />

        <div class="min-w-0 flex-1">
          <p class="text-sm truncate">{{ item.resultName }} {{ STATUS_META[item.status].verb }}</p>
          <p v-if="item.actorName" class="text-xs text-muted-foreground truncate">
            by {{ item.actorName }}
          </p>
        </div>

        <p class="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
          {{ timeAgo(item.occurredAt) }}
        </p>
      </div>
    </div>
  </div>
</template>
