<script lang="ts" setup>
import { type LoginInputType } from "~~/shared/validators/auth"

useSeoMeta({
  title: "Log in | ScoreBase",
  description: "Enter your email & password to log in."
})

const auth = useAuth()

const isSubmitting = ref(false)
async function onSubmit(payload: LoginInputType) {
  isSubmitting.value = true
  await auth.signIn.email(payload, {
    async onSuccess() {
      isSubmitting.value = false
      useSonner.success("Login successful, redirecting you....")
      await auth.refresh()
      await navigateTo("/dashboard")
    },
    onError(e: any) {
      useSonner.error(e.error.message)
    }
  })
  isSubmitting.value = false
}
</script>

<template>
  <div class="relative flex h-screen items-center justify-center">
    <div
      class="relative z-10 border-border/60 bg-card dark:border-border w-full max-w-95 border px-8 py-5 shadow-xs min-[480px]:rounded-lg"
    >
      <div class="text-center mb-5">
        <h1 class="mb-3 text-2xl font-bold text-primary underline underline-offset-4">ScoreBase</h1>
        <h3 class="text-lg font-bold tracking-tight">Welcome Back!</h3>
        <p class="text-xs text-muted-foreground mt-1">Enter your email & password to log in.</p>
      </div>

      <FormKit type="form" :actions="false" @submit="onSubmit">
        <fieldset :disabled="isSubmitting">
          <FormKit
            type="email"
            name="email"
            label="Email Address"
            placeholder="user@example.com"
            validation="required|email"
          />

          <FormKitPassword
            label="Password"
            placeholder="*************"
            name="password"
            validation="required"
          />

          <UiButton
            :loading="isSubmitting"
            class="w-full"
            type="submit"
            size="lg"
            icon-right="lucide:arrow-right"
            text="Continue to account"
          />
        </fieldset>
      </FormKit>
      <p class="mt-8 text-xs text-center text-muted-foreground">
        Forgot password? Please contact your admin to reset your password!
      </p>
    </div>

    <AppSubtleBg />
  </div>
</template>
