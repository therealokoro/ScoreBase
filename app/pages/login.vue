<script lang="ts" setup>
import { LoginSchema, type LoginInputType } from "~~/shared/validators/auth"

useSeoMeta({
  title: "Log in | ScoreBase",
  description: "Enter your email & password to log in."
})

const { handleSubmit, isSubmitting } = useForm<LoginInputType>({
  validationSchema: toTypedSchema(LoginSchema)
})

const auth = useAuth()

const submit = handleSubmit(async (payload) => {
  await auth.signIn.email(payload, {
    async onSuccess() {
      useSonner.success("Login successful, redirecting you....")
      await auth.refresh()
      await navigateTo("/dashboard")
    },
    onError(e: any) {
      useSonner.error(e.error.message)
    }
  })
})
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div
      class="border-border/60 bg-card dark:border-border w-full max-w-95 border px-8 py-5 shadow-xs min-[480px]:rounded-lg"
    >
      <h1 class="text-lg font-bold tracking-tight">Welcome, Log in</h1>
      <p class="text-sm text-muted-foreground mt-1">Enter your email & password to log in.</p>

      <form class="mt-10" @submit="submit">
        <fieldset :disabled="isSubmitting" class="grid gap-5">
          <FormInput
            label="Email Address"
            type="email"
            name="email"
            placeholder="user@example.com"
          />
          <FormPassword label="Password" placeholder="*************" name="password" />
          <UiButton
            :loading="isSubmitting"
            class="w-full"
            type="submit"
            size="lg"
            text="Continue to account"
          />
        </fieldset>
      </form>
      <p class="mt-8 text-xs text-center text-muted-foreground">
        Forgot password? Please contact your admin to reset your password!
      </p>
    </div>
  </div>
</template>
