<script lang="ts" setup>
import {
  UpdateAccountPasswordSchema,
  type UpdateAccountPasswordInput
} from "~~/shared/validators/actors"

const auth = useAuth()
const userId = computed(() => auth.currentUser.value?.id)

const { handleSubmit, isSubmitting, resetForm, setFieldValue } =
  useForm<UpdateAccountPasswordInput>({
    initialValues: { id: userId.value },
    validationSchema: toTypedSchema(UpdateAccountPasswordSchema)
  })

watch(
  userId,
  (id) => {
    if (id) setFieldValue("id", id)
  },
  { immediate: true }
)

const { $orpc } = useNuxtApp()
const updatPassword = useMutation($orpc.account.updatePassword.mutationOptions())
const onSubmit = handleSubmit((payload) => {
  if (!userId.value) return

  useSonner.promise(updatPassword.mutateAsync(payload), {
    loading: "Updating password, please wait...",
    success: () => {
      resetForm()
      return "Password updated successfully"
    },
    error: (e: any) => e.message
  })
})
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
      <form @submit.prevent="onSubmit()" id="change-password-form">
        <fieldset :disabled="isSubmitting" class="md:max-w-md space-y-4">
          <FormPassword
            name="currentPassword"
            placeholder="**************"
            label="Current Password"
          />

          <FormPassword name="newPassword" placeholder="**************" label="New Password" />

          <FormPassword
            name="confirmPassword"
            placeholder="**************"
            label="Confirm Password"
          />

          <UiButton
            :loading="isSubmitting"
            type="submit"
            block
            text="Change Password"
            class="h-10"
          />
        </fieldset>
      </form>
    </div>
  </div>
</template>
