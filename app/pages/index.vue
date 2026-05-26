<script setup lang="ts">
const auth = useAuth()

async function signIn() {
  await auth.signIn.email({ email: "user@admin.com", password: "admin-123" })
}

const signUpRes = ref<unknown>()
async function signUp() {
  const res = await $fetch("/api/seed/admin", { method: "POST" })
  signUpRes.value = res
}
</script>

<template>
  <UiContainer>
    <ui-button @click="signUp">Sign Up</ui-button>
    <ui-button @click="signIn">Sign In</ui-button>
    <ui-button @click="navigateTo('/admin')">Go to dashboard</ui-button>

    <p v-if="signUpRes">{{ signUpRes }}</p>

    <pre>{{ auth.currentUser }}</pre>
  </UiContainer>
</template>
