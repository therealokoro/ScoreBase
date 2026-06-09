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
      <FormKit type="form" :actions="false" @submit="handleSubmit">
        <fieldset class="md:max-w-md space-y-6">
          <FormKit
            type="text"
            name="schoolName"
            label="School Name"
            placeholder="Enter your school's name here"
            help="This will be displayed on the result page"
          />

          <FormKit
            type="text"
            name="sessionSuffix"
            label="Session Suffix"
            placeholder="e.g Academic Session"
            help="This is a text prepended to the session names"
          />

          <FormKit
            type="_select"
            name="termPreset"
            label="Term Preset"
            placeholder="Select a term preset"
            :options="termPresetOptions"
            help="Choose how you'd like your terms to be created"
          />

          <FormKit type="group" name="scoreDistribution">
            <div class="space-y-2">
              <UiFieldLabel>Score Distribution</UiFieldLabel>
              <div class="grid grid-cols-4 gap-2">
                <FormKit
                  v-for="item in ['1st', '2nd', '3rd', 'Exam']"
                  type="number"
                  :name="item"
                  :label="item === 'Exam' ? item : `${item} CA`"
                  :classes="{
                    outer: 'mb-0',
                    label: 'text-xs text-muted-foreground',
                    input: 'text-xs'
                  }"
                  placeholder="Enter score"
                  validation="required"
                  :validation-messages="{ required: 'Required' }"
                />
              </div>
              <UiFieldDescription>
                Input your preferred score distribution for CAs and Exams
              </UiFieldDescription>
            </div>
          </FormKit>

          <FormKit
            type="_tags"
            name="subjectTags"
            label="Subject Tags"
            placeholder="Create tags for subjects"
            help="Subject tags are used to filter and manage subjects"
          />

          <FormKit
            type="text"
            name="studentIdPrefix"
            label="Student ID Prefix"
            placeholder="e.g STU-2026-XXXX"
            help="Create a prefix for student's ID creation"
          />
        </fieldset>
      </FormKit>
    </div>
  </div>
</template>
