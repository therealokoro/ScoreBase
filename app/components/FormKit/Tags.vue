<script lang="ts" setup>
const props = defineProps<{ context: any }>()

function handleInput(value: any) {
  props.context.node.input(value)
}

const addOnKeys = computed(() => props.context.addOnKeys || ["Enter", ","])

const isInvalid = computed(
  () => props.context.state.validationVisible && !props.context.state.valid
)
</script>

<template>
  <UiTagsInput
    :value="context.value"
    :add-on-keys="addOnKeys"
    :disabled="props.context.disabled"
    :aria-invalid="isInvalid || undefined"
    :aria-describedby="context.help ? `${context.id}-desc` : undefined"
    data-slot="input-group-control"
    class="w-full"
    @update:modelValue="handleInput"
  >
    <UiTagsInputInput
      :id="context.id"
      :placeholder="context.placeholder"
      :disabled="context.disabled"
      @blur="context.handlers.blur()"
    />

    <div class="flex flex-wrap gap-1 mb-2.5" v-if="context.value?.length">
      <UiTagsInputItem v-for="tag in context.value" :key="tag" :value="tag" />
    </div>
  </UiTagsInput>
</template>
