<script lang="ts" setup>
/**
 * A colour swatch that reveals the picker in a popover. Every colour control in the builder hides
 * behind one of these, so a panel stays compact until a colour is actually being edited.
 */
withDefaults(defineProps<{ label?: string }>(), { label: "Colour" })

const color = defineModel<string>({ required: true })

const open = ref(false)
const root = useTemplateRef("root")
onClickOutside(root, () => (open.value = false))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="border-border size-6 shrink-0 rounded border shadow-xs"
      :style="{ backgroundColor: color }"
      :aria-label="label"
      :aria-expanded="open"
      @click="open = !open"
    />

    <div
      v-if="open"
      class="bg-popover border-border absolute right-0 z-30 mt-1 w-56 space-y-2 rounded-lg border p-2 shadow-md"
    >
      <UiColorPicker
        v-model="color"
        :show-format-toggle="false"
        :show-result="false"
        :show-presets="false"
      />
    </div>
  </div>
</template>
