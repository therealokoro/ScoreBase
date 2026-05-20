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

const isOpen = ref(false)

const enteredText = ref("")
</script>

<template>
  <UiAlertDialog v-model:open="isOpen">
    <!-- Dialog Trigger -->
    <UiAlertDialogTrigger as-child>
      <slot />
    </UiAlertDialogTrigger>

    <UiAlertDialogContent @escape-key-down="emit('cancel')">
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

      <!-- Dialog Footer -->
      <UiAlertDialogFooter>
        <slot name="actions">
          <UiAlertDialogCancel @click="emit('cancel')" />
          <UiAlertDialogAction
            :disabled="enteredText != confirmInputText"
            @click="emit('confirm')"
            variant="destructive"
          />
        </slot>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
