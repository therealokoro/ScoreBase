<script lang="ts" setup>
definePageMeta({ middleware: ["admin-only"] })

const termPresetOptions = [
  { label: "1st, 2nd and 3rd", value: "numbered" },
  { label: "First, Second and Third", value: "verbertim" }
]

function handleSubmit(payload: any) {
  console.log(payload)
}
</script>

<template>
  <div class="w-full space-y-5">
    <!-- Heading -->
    <div class="space-y-2">
      <ui-heading :level="5">Academic Settings</ui-heading>
      <p class="text-sm text-muted-foreground">Manage the school related settings and preference</p>
      <UiSeparator />
    </div>

    <!-- Body Content -->
    <div class="w-full">
      <FormKit type="form" @submit="handleSubmit">
        <!-- <FormKit type="text" name="email" label="Email" />
        <FormKit type="password" name="password" label="Password" />
        <FormKit type="select" name="role" label="Role" :options="termPresetOptions" />
        <FormKit type="checkbox" name="terms" label="I agree" />
        <FormKit type="submit" label="Submit" /> -->
      </FormKit>
    </div>
  </div>
</template>
