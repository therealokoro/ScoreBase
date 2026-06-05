<script lang="ts" setup>
import { UpdateAccountInfoSchema, type UpdateAccountInfoInput } from "~~/shared/validators/actors"

const auth = useAuth()
const user = computed(() => auth.currentUser.value)

const { handleSubmit, isSubmitting, setValues } = useForm<UpdateAccountInfoInput>({
  initialValues: { ...user.value },
  validationSchema: toTypedSchema(UpdateAccountInfoSchema)
})

watch(
  user,
  (values) => {
    if (values) setValues({ ...values })
  },
  { immediate: true }
)

const { $orpc } = useNuxtApp()
const updateAccount = useMutation($orpc.account.updateAccount.mutationOptions())
const onSubmit = handleSubmit((payload) => {
  useSonner.promise(updateAccount.mutateAsync(payload), {
    loading: "Updating account info, please wait...",
    success: async () => {
      await auth.refresh()
      return "Account info updated successfully"
    },
    error: (e: any) => e.message
  })
})
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
      <form @submit.prevent="onSubmit()" id="account-info-form">
        <fieldset :disabled="isSubmitting" class="md:max-w-md space-y-4">
          <FormInput name="name" placeholder="e.g John Doe" label="Full Name" />
          <FormInput name="email" placeholder="e.g user@gmail.com" label="Email Address" />
          <FormInput name="phoneNumber" placeholder="e.g 08012345678" label="Phone Number" />
          <UiButton
            :loading="isSubmitting"
            type="submit"
            block
            text="Update Account"
            class="h-10"
          />
        </fieldset>
      </form>
    </div>
  </div>
</template>
