<script lang="ts" setup>
import { reset } from "@formkit/vue"
import { type UpdateAccountPasswordInput } from "~~/shared/validators/actors"

const auth = useAuth()
const userId = computed(() => auth.user.value.id)

const { $orpc } = useNuxtApp()
const updatPassword = useMutation($orpc.account.updatePassword.mutationOptions())

const isSubmitting = ref(false)
async function onSubmit(payload: UpdateAccountPasswordInput) {
  if (!userId.value) return

  isSubmitting.value = true
  useSonner.promise(updatPassword.mutateAsync(payload), {
    loading: "Updating password, please wait...",
    success: () => {
      reset("change-password-form")
      isSubmitting.value = false
      return "Password updated successfully"
    },
    error: (e: any) => {
      isSubmitting.value = false
      return e.message
    }
  })
}
</script>

<template>
  <div class="w-full space-y-5">
    <!-- Hading -->
    <div class="space-y-2">
      <ui-heading :level="5">Security Settings</ui-heading>
      <p class="text-sm text-muted-foreground">Update your accounts security settings</p>
      <UiSeparator />
    </div>

    <!-- Body Content -->
    <div class="w-full">
      <FormKit type="form" :actions="false" @submit="onSubmit" id="change-password-form">
        <fieldset :disabled="isSubmitting" class="md:max-w-md space-y-4">
          <FormKitMessages class="mb-4" />

          <FormKitPassword
            name="currentPassword"
            placeholder="**************"
            label="Current Password"
            validation="required"
            help="Enter your current account password"
          />

          <FormKitPassword
            name="newPassword"
            placeholder="**************"
            label="New Password"
            validation="required|min:5"
            help="Not less than 5 characters long"
          />

          <FormKitPassword
            name="confirmPassword"
            placeholder="**************"
            label="Confirm Password"
            validation="required|confirm:newPassword"
          />

          <UiButton
            block
            class="h-10"
            type="submit"
            text="Change Password"
            :loading="isSubmitting"
          />
        </fieldset>
      </FormKit>
    </div>
  </div>
</template>
