<script lang="ts" setup>
const auth = useAuth()
const creds = { email: "okoro@gmail.com", password: "12345678", phoneNumber: "0123456789" }
const signUpRes = ref(false)

async function signUp() {
  await auth.signUp.email({
    name: "Okoro Redemption",
    ...creds,
    fetchOptions: {
      onSuccess() {
        alert("signed up successfully")
      }
    }
  })
}

async function signIn() {
  await auth.signIn.email({ ...creds })
}

const { $orpc } = useNuxtApp()
const makeMutation = useMutation($orpc.academicSession.create.mutationOptions({}))
function mutate() {
  makeMutation.mutate({
    name: "2024/2025 Session"
  })
}
const { data: fetchedData, refetch } = useQuery(
  $orpc.academicSession.list.queryOptions({
    enabled: false
  })
)
</script>

<template>
  <div>
    <pre>Sign Up Res: {{ signUpRes }}</pre>
    <pre>{{ auth.currentUser }}</pre>
    <ui-button @click="signUp()">Sign Up</ui-button>
    <ui-button @click="signIn()">Login</ui-button>
    <ui-button @click="auth.signOut()">Log out</ui-button>
    <ui-button @click="mutate()">Mutate</ui-button>
    <ui-button @click="refetch()">Fetch Data</ui-button>
    <pre>Fetched: {{ fetchedData }}</pre>
  </div>
</template>
