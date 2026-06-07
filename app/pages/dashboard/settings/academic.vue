<script lang="ts" setup>
definePageMeta({ middleware: ["admin-only"] })

const termPresetOptions = [
  { label: "1st, 2nd and 3rd", value: "numbered" },
  { label: "First, Second and Third", value: "verbertim" }
]
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
      <form @submit.prevent="" id="account-info-form">
        <fieldset class="md:max-w-md space-y-4">
          <FormInput
            name="school_name"
            label="School Name"
            placeholder="Enter the name of your school"
            description="This will be used in the result page"
          />

          <FormSelect
            name="termPreset"
            label="Term Preset"
            placeholder="Select a term preset"
            description="This is how terms will be displayed"
            :options="termPresetOptions"
          />

          <UiField>
            <UiFieldLabel>Total Score Per Term</UiFieldLabel>
            <UiFieldDescription>
              This is the total score obtainable per term for each student
            </UiFieldDescription>
            <div class="grid grid-cols-3 gap-4">
              <FormNumber
                :min="10"
                name="first-term-score"
                label="1st Term"
                placeholder="1st Term"
              />
              <FormNumber
                :min="10"
                name="second-term-score"
                label="2nd Term"
                placeholder="2nd Term"
              />
              <FormNumber
                :min="10"
                name="third-term-score"
                label="3rd Term"
                placeholder="3rd Term"
              />
            </div>
          </UiField>
        </fieldset>
      </form>
    </div>
  </div>
</template>
