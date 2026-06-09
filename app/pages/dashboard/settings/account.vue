<script lang="ts" setup>
import { type UpdateAccountInfoInput } from "~~/shared/validators/actors"

const auth = useAuth()
const user = computed(() => auth.currentUser.value)

// watch(
//   user,
//   (values) => {
//     if (values) setValues({ ...values })
//   },
//   { immediate: true }
// )

const { $orpc } = useNuxtApp()
const updateAccount = useMutation($orpc.account.updateAccount.mutationOptions())

const isSubmitting = ref(false)
async function onSubmit(payload: UpdateAccountInfoInput) {
  isSubmitting.value = true
  useSonner.promise(updateAccount.mutateAsync(payload), {
    loading: "Updating account info, please wait...",
    success: async () => {
      isSubmitting.value = false
      await auth.refresh()
      return "Account info updated successfully"
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
      <ui-heading :level="5">Account Settings</ui-heading>
      <p class="text-sm text-muted-foreground">Manage your account infomations</p>
      <UiSeparator />
    </div>

    <!-- Body Content -->
    <div class="w-full">
      <FormKit type="form" :actions="false" :value="user" @submit="onSubmit" id="account-info-form">
        <fieldset :disabled="isSubmitting" class="md:max-w-md space-y-4">
          <FormKitMessages class="mb-3" />

          <FormKit
            type="text"
            name="name"
            placeholder="e.g John Doe"
            label="Full Name"
            validation="required"
          />

          <FormKit
            type="email"
            name="email"
            placeholder="e.g user@gmail.com"
            label="Email Address"
            validation="required|email"
          />

          <FormKit
            type="tel"
            name="phoneNumber"
            placeholder="e.g 08012345678"
            label="Phone Number"
            validation="required"
          />

          <UiButton
            :loading="isSubmitting"
            type="submit"
            block
            text="Update Account"
            class="h-10"
          />
        </fieldset>
      </FormKit>
    </div>
  </div>
</template>
