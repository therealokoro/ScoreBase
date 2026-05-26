<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    confirmInputText?: string
  }>(),
  {
    title: "Confirm Delete"
  }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const hasInputField = computed(() => !!props.confirmInputText)
const isOpen = defineModel("open", { default: false })
const enteredText = ref("")

onUnmounted(() => {
  enteredText.value = ""
})
</script>

<template>
  <UiAlertDialog v-model:open="isOpen">
    <!-- Dialog Trigger -->
    <UiAlertDialogTrigger as-child>
      <slot />
    </UiAlertDialogTrigger>

    <UiAlertDialogContent @escape-key-down="emit('cancel')">
      <div class="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
        <div
          class="border-border flex size-9 shrink-0 items-center justify-center rounded-full border"
          aria-hidden="true"
        >
          <Icon name="lucide:circle-alert" class="size-4 opacity-80" />
        </div>

        <div class="w-full space-y-4">
          <!-- Dialog Header -->
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>{{ title }}</UiAlertDialogTitle>
            <UiAlertDialogDescription v-if="description">
              {{ description }}
            </UiAlertDialogDescription>
          </UiAlertDialogHeader>

          <div class="w-full space-y-2" v-if="hasInputField">
            <UiInput v-model="enteredText" :placeholder="`Enter confirmation text to continue`" />
            <p class="text-xs text-muted-foreground">
              Please type <span class="font-semibold">{{ confirmInputText }}</span> to continue
            </p>
          </div>
        </div>
      </div>

      <!-- Dialog Footer -->
      <UiAlertDialogFooter>
        <slot name="actions">
          <UiAlertDialogCancel @click="emit('cancel')" />
          <UiAlertDialogAction
            :disabled="hasInputField ? enteredText != confirmInputText : false"
            @click="emit('confirm')"
            variant="destructive"
          />
        </slot>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
