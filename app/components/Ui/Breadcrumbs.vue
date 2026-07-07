<script lang="ts">
import { normalizeClass } from "vue"
</script>

<script setup lang="ts">
import type { HTMLAttributes } from "vue"

export interface BreadcrumbItem {
  label?: string
  icon?: string
  link?: string
  disabled?: boolean
  slot?: string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  click?: Function
}

const props = withDefaults(
  defineProps<{
    items?: BreadcrumbItem[]
    separator?: string
    class?: HTMLAttributes["class"]
    /** Max items before collapsing middle ones into a dropdown. Default: 3 */
    maxItems?: number
  }>(),
  {
    separator: "lucide:chevron-right",
    items: () => [],
    maxItems: 3
  }
)

const isNotLastItem = (index: number) => index !== props.items.length - 1

const shouldCollapse = computed(() => props.items.length > props.maxItems)
const firstItem = computed(() => props.items[0])
const lastItem = computed(() => props.items[props.items.length - 1])
const collapsedItems = computed(() =>
  shouldCollapse.value ? props.items.slice(1, props.items.length - 1) : []
)
const visibleItems = computed(() => (shouldCollapse.value ? [] : props.items))

const styles = tv({
  base: "flex w-full flex-wrap items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5"
})
</script>

<template>
  <nav
    data-slot="breadcrumb"
    aria-label="breadcrumb"
    :class="styles({ class: normalizeClass(props.class) || undefined })"
  >
    <!-- Collapsed mode: first + ellipsis dropdown + last -->
    <template v-if="shouldCollapse">
      <div class="group flex items-center gap-2">
        <Icon
          v-if="firstItem?.icon"
          :name="firstItem?.icon"
          class="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground"
        />
        <NuxtLink
          v-if="firstItem?.label"
          :to="firstItem?.link ?? ''"
          class="text-muted-foreground transition-colors underline-offset-2 group-hover:text-foreground group-hover:underline"
          >{{ firstItem?.label }}</NuxtLink
        >
      </div>

      <Icon :name="separator" class="text-muted-foreground h-3 w-3" />

      <UiDropdownMenu>
        <UiDropdownMenuTrigger
          class="flex size-6 items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label="Show hidden breadcrumbs"
        >
          <Icon name="lucide:ellipsis" class="size-3.5 text-muted-foreground" />
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="start">
          <UiDropdownMenuItem
            v-for="(item, i) in collapsedItems"
            :key="i"
            :as="item.link ? 'a' : 'button'"
            :href="item.link"
            class="gap-2"
            @click="item.click?.()"
          >
            <Icon v-if="item.icon" :name="item.icon" class="size-3.5 shrink-0" />
            {{ item.label }}
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>

      <Icon :name="separator" class="text-muted-foreground h-3 w-3" />

      <div class="group flex items-center gap-2">
        <Icon v-if="lastItem?.icon" :name="lastItem?.icon" class="size-3.5 shrink-0 text-primary" />
        <span class="text-primary font-medium">{{ lastItem?.label }}</span>
      </div>
    </template>

    <!-- Flat mode: all items rendered normally -->
    <template v-else>
      <template v-for="(item, i) in visibleItems" :key="i">
        <slot :name="item.slot || 'default'">
          <div data-slot="breadcrumb-item" class="flex items-center gap-3">
            <div class="group flex items-center gap-2">
              <slot name="crumbIcon" :item="item" :index="i">
                <Icon
                  v-if="item.icon"
                  data-slot="breadcrumb-icon"
                  :name="item.icon"
                  class="size-3.5 shrink-0"
                  :class="[
                    isNotLastItem(i)
                      ? 'text-muted-foreground group-hover:text-foreground'
                      : 'text-primary'
                  ]"
                />
              </slot>
              <slot :item="item" :is-not-last-item="isNotLastItem" :index="i" name="link">
                <NuxtLink
                  v-if="item.label"
                  :to="!item?.disabled ? item.link : ''"
                  data-slot="breadcrumb-label"
                  :class="[
                    item.link && !item.disabled && 'underline-offset-2 group-hover:underline',
                    isNotLastItem(i)
                      ? 'text-muted-foreground group-hover:text-foreground'
                      : 'text-primary font-medium'
                  ]"
                  class="text-foreground transition-colors"
                  @click="item?.click?.()"
                  >{{ item.label }}</NuxtLink
                >
              </slot>
            </div>
          </div>
        </slot>
        <slot name="separator" :item="item" :index="i">
          <Icon
            v-if="isNotLastItem(i)"
            data-slot="breadcrumb-separator"
            :name="separator"
            class="text-muted-foreground h-3 w-3"
          />
        </slot>
      </template>
    </template>
  </nav>
</template>
