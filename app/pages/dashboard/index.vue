<script lang="ts" setup>
const { user, isLoggedIn } = useAuth()
</script>

<template>
  <Page title="Overview">
    <div v-if="isLoggedIn" class="text-sm text-muted-foreground">
      <p>Welcome Back, {{ user.name }}</p>
      <p></p>
    </div>
  </Page>
</template>
