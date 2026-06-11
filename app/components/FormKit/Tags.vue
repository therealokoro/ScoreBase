<script lang="ts" setup>
const props = defineProps<{ context: any }>()

const addOnKeys = computed(() => props.context.addOnKeys || ["Enter", ","])

const isInvalid = computed(
  () => props.context.state.validationVisible && !props.context.state.valid
)

// Local ref seeded from context.value
const tags = ref<string[]>(props.context.value ?? [])

// Keep in sync if FormKit sets the value externally (e.g. form :value prop)
watch(
  () => props.context.value,
  (val) => {
    if (JSON.stringify(val) !== JSON.stringify(tags.value)) {
      tags.value = val ?? []
    }
  }
)

// Push changes back into FormKit
watch(tags, (val) => {
  props.context.node.input(val)
})
</script>

<template>
  <UiTagsInput
    v-model="tags"
    :add-on-keys="addOnKeys"
    :disabled="props.context.disabled"
    :aria-invalid="isInvalid || undefined"
    :aria-describedby="context.help ? `${context.id}-desc` : undefined"
    data-slot="input-group-control"
    class="w-full"
  >
    <UiTagsInputInput
      :id="context.id"
      :placeholder="context.placeholder"
      :disabled="context.disabled"
      @blur="context.handlers.blur()"
    />

    <div class="flex flex-wrap gap-1 mb-2.5" v-if="tags.length">
      <UiTagsInputItem v-for="tag in tags" :key="tag" :value="tag" />
    </div>
  </UiTagsInput>
</template>
