<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { StyledText, TextAlign } from "~~/shared/constants/report-card"

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    /** Render a textarea instead of a single-line input. */
    multiline?: boolean
  }>(),
  { label: "", placeholder: "", multiline: false }
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

const showColor = ref(false)
</script>

<template>
  <div class="space-y-2">
    <UiLabel v-if="label">{{ label }}</UiLabel>

    <UiTextarea v-if="multiline" v-model="text.value" :rows="2" :placeholder="placeholder" />
    <UiInput v-else v-model="text.value" :placeholder="placeholder" />

    <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div class="flex min-w-40 items-center gap-2">
        <span class="text-muted-foreground text-xs">Size</span>
        <UiSlider
          :model-value="[text.style.fontSize]"
          :min="10"
          :max="28"
          :step="1"
          @update:model-value="(value) => (text.style.fontSize = value?.[0] ?? 14)"
        />
        <span class="w-6 text-right text-xs tabular-nums">{{ text.style.fontSize }}</span>
      </div>

      <label class="flex items-center gap-2">
        <UiSwitch v-model="bold" aria-label="Bold text" />
        <span class="text-muted-foreground text-xs">Bold</span>
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
      </div>

      <button
        type="button"
        class="border-border focus-visible:ring-ring size-7 shrink-0 rounded-md border shadow-xs focus-visible:ring-2 focus-visible:outline-none"
        :style="{ backgroundColor: text.style.color }"
        aria-label="Text colour"
        @click="showColor = !showColor"
      />

      <div v-if="showColor" class="w-full rounded-md border border-border p-2">
        <UiColorPicker
          v-model="text.style.color"
          :show-format-toggle="false"
          :show-result="false"
          :show-presets="false"
        />
      </div>
    </div>
  </div>
</template>
