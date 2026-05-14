<script lang="ts" setup>
const auth = useAuth();
const creds = { email: "okoro@gmail.com", password: "12345678", phoneNumber: "0123456789" };
const signUpRes = ref(false);

async function signUp() {
  await auth.signUp.email({
    name: "Okoro Redemption",
    ...creds,
    fetchOptions: {
      onSuccess() {
        alert("signed up successfully");
      },
    },
  });
}

async function signIn() {
  await auth.signIn.email({ ...creds });
}
</script>

<template>
  <div>
    <pre>Sign Up Res: {{ signUpRes }}</pre>
    <pre>{{ auth.currentUser }}</pre>
    <button @click="signUp()">Sign Up</button>
    <button @click="signIn()">Login</button>
    <button @click="auth.signOut()">Log out</button>
  </div>
</template>
