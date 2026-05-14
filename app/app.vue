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

const { $orpc } = useNuxtApp();
const { data: fetchedData, refetch } = useQuery(
  $orpc.health.queryOptions({
    enabled: false,
  }),
);
</script>

<template>
  <div>
    <pre>Sign Up Res: {{ signUpRes }}</pre>
    <pre>{{ auth.currentUser }}</pre>
    <button @click="signUp()">Sign Up</button>
    <button @click="signIn()">Login</button>
    <button @click="auth.signOut()">Log out</button>
    <button @click="refetch()">Fetch Data</button>
    <pre>Fetched: {{ fetchedData }}</pre>
  </div>
</template>
