<script setup lang="ts">
const auth = useAuth()
const creds = {
  email: "okoro@gmail.com",
  name: "Okoro Redemption",
  password: "admin-123",
  phoneNumber: "0987654321"
}
async function signUp() {
  await auth.signUp.email({ ...creds })
}
async function signIn() {
  await auth.signIn.email({ email: creds.email, password: creds.password })
}
</script>

<template>
  <UiContainer>
    <ui-button @click="signUp">Sign Up</ui-button>
    <ui-button @click="signIn">Sign In</ui-button>
    <ui-button @click="navigateTo('/admin')">Go to dashboard</ui-button>

    <pre>{{ auth.currentUser }}</pre>
  </UiContainer>
</template>
