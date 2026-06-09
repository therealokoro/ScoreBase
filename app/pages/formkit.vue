<script setup lang="ts">
/**
 * App/pages/register.vue
 *
 * Demonstrates three ways to use icons with the FormKit shadcn/ui theme:
 *
 * 1. <FormKitField> — wrapper component, cleanest DX
 * 2. <FormKit> — direct, using iconLoader wired in formkit.config.ts
 * 3. Plain <FormKit> — no icons, exactly as before
 */
const submitted = ref<Record<string, unknown> | null>(null)

function onSubmit(data: Record<string, unknown>) {
  submitted.value = data
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div
      class="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div class="flex flex-col space-y-1.5 p-6 pb-0">
        <h2 class="text-lg font-semibold leading-none tracking-tight">Create an account</h2>
        <p class="text-sm text-muted-foreground">Fill in your details to get started.</p>
      </div>

      <div class="p-6 pt-4">
        <template v-if="submitted">
          <pre class="rounded-md bg-muted px-4 py-3 text-xs font-mono overflow-auto">
            {{ JSON.stringify(submitted, null, 2) }}
          </pre>
          <button
            class="mt-4 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 transition-colors"
            @click="submitted = null"
          >
            ← Back
          </button>
        </template>

        <FormKit v-else type="form" :actions="false" @submit="onSubmit">
          <FormKitMessages />

          <FormKit
            type="text"
            name="username"
            label="Username"
            placeholder="johndoe"
            prefix-icon="lucide:user"
            validation="required"
          />

          <!-- prefix icon only -->
          <FormKit
            type="email"
            name="email"
            label="Email address"
            placeholder="jane@example.com"
            prefix-icon="lucide:mail"
            validation="required|email"
            help="We'll never share your email."
          />

          <!-- suffix icon — toggling password visibility is a natural use case -->
          <FormKitPassword
            name="password"
            label="Password"
            placeholder="Min. 8 characters"
            validation="required|length:8"
          />

          <!-- both prefix and suffix -->
          <FormKit
            type="text"
            name="website"
            label="Website"
            placeholder="example.com"
            prefix-icon="lucide:globe"
            suffix-icon="lucide:external-link"
          />

          <!-- ── Using <FormKit> directly (iconLoader handles resolution) ── -->
          <!-- Identical result to FormKitField, just slightly more verbose  -->

          <FormKit
            type="tel"
            name="phone"
            label="Phone number"
            placeholder="+1 (555) 000-0000"
            prefix-icon="lucide:phone"
          />

          <!-- ── Plain <FormKit> — no icons, exactly as before ────────────── -->

          <FormKit
            type="_select"
            name="role"
            label="Role"
            multiple
            placeholder="Select a role…"
            :options="['Developer', 'Designer', 'Product Manager', 'Other']"
            validation="required|is:Designer"
          />

          <FormKit
            type="_tags"
            name="hobbies"
            label="Hobbies"
            placeholder="What are your hobbies"
            help="Use the enter or comma key to register each word"
            validation="required"
          />

          <FormKit
            type="textarea"
            name="bio"
            label="Bio"
            placeholder="Tell us a little about yourself…"
            help="Max 280 characters."
            :validation="[['length', 0, 280]]"
          />

          <div class="border-t border-border my-4" />

          <FormKit
            type="checkbox"
            name="terms"
            label="I agree to the Terms of Service"
            validation="accepted"
            validation-visibility="submit"
          />

          <FormKit type="submit" label="Create account" />
        </FormKit>
      </div>
    </div>
  </div>
</template>
