<script lang="ts" setup>
const { currentUser } = useAuth()
</script>

<template>
  <Page title="Overview">
    <div v-if="currentUser" class="text-sm text-muted-foreground">
      <p>Welcome Back, {{ currentUser.name }}</p>
      <p></p>
    </div>
  </Page>
</template>
