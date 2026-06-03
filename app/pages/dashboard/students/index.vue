<script lang="ts" setup>
definePageMeta({ middleware: ["admin-only"] })
</script>

<template>
  <Page title="Students" description="Create, edit, delete student records">
    <StudentListTable />
  </Page>
</template>
