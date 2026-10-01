<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { StyledText, TextAlign } from "~~/shared/constants/report-card"

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    /** Render a textarea instead of a single-line input. */
    multiline?: boolean
    /** Size slider bounds — kept tight so everything still fits on one A4 page. */
    minSize?: number
    maxSize?: number
  }>(),
  { label: "", placeholder: "", multiline: false, minSize: 9, maxSize: 28 }
)

// Named `text` (not `model`) so `text.value` in the template reads as the StyledText value
// string rather than colliding with the model ref's own `.value`.
const text = defineModel<StyledText>({ required: true })

const alignOptions: { value: TextAlign; icon: string; label: string }[] = [
  { value: "left", icon: ICONS.alignLeft, label: "Align left" },
  { value: "center", icon: ICONS.alignCenter, label: "Align center" },
  { value: "right", icon: ICONS.alignRight, label: "Align right" }
]

const bold = computed({
  get: () => text.value.style.fontWeight === "bold",
  set: (value: boolean) => {
    text.value.style.fontWeight = value ? "bold" : "normal"
  }
})

// The extra styling controls live in a popover so the panel stays compact by default.
const styleOpen = ref(false)
const root = useTemplateRef("root")
onClickOutside(root, () => (styleOpen.value = false))
</script>

<template>
  <div ref="root" class="relative space-y-1.5">
    <UiLabel v-if="label" class="text-xs">{{ label }}</UiLabel>

    <div class="flex items-start gap-1">
      <UiTextarea
        v-if="multiline"
        v-model="text.value"
        :rows="2"
        :placeholder="placeholder"
        class="min-h-8 flex-1 text-xs"
      />
      <UiInput v-else v-model="text.value" :placeholder="placeholder" class="h-8 flex-1 text-xs" />

      <UiButton
        type="button"
        variant="outline"
        size="icon-sm"
        :icon="ICONS.edit"
        label="Text style"
        :aria-expanded="styleOpen"
        @click="styleOpen = !styleOpen"
      />
    </div>

    <div
      v-if="styleOpen"
      class="bg-popover absolute right-0 z-20 mt-1 w-64 space-y-3 rounded-lg border border-border p-3 shadow-md"
    >
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground w-10 text-[10px]">Size</span>
        <UiSlider
          :model-value="[text.style.fontSize]"
          :min="minSize"
          :max="maxSize"
          :step="1"
          @update:model-value="(value) => (text.style.fontSize = value?.[0] ?? minSize)"
        />
        <span class="w-5 text-right text-[10px] tabular-nums">{{ text.style.fontSize }}</span>
      </div>

      <div class="flex items-center justify-between gap-2">
        <label class="flex items-center gap-2">
          <UiSwitch v-model="bold" aria-label="Bold text" />
          <span class="text-muted-foreground text-[10px]">Bold</span>
        </label>

        <div class="flex items-center gap-1">
          <UiButton
            v-for="option in alignOptions"
            :key="option.value"
            type="button"
            :variant="text.style.align === option.value ? 'secondary' : 'ghost'"
            size="icon-sm"
            :icon="option.icon"
            :label="option.label"
            @click="text.style.align = option.value"
          />

          <button
            type="button"
            class="border-border size-6 shrink-0 rounded border shadow-xs"
            :style="{ backgroundColor: text.style.color }"
            aria-label="Text colour"
            @click="styleOpen = false"
          />
        </div>
      </div>

      <UiColorPicker
        v-model="text.style.color"
        :show-format-toggle="false"
        :show-result="false"
        :show-presets="false"
      />
    </div>
  </div>
</template>
