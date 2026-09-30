<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { LogoPlacement, SchoolInfoConfig } from "~~/shared/constants/report-card"

const config = defineModel<SchoolInfoConfig>({ required: true })

const placements: { value: LogoPlacement; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" },
  { value: "left-right", label: "Both sides" }
]

const showSecondaryLogo = computed(() =>
  ["center", "left-right"].includes(config.value.logoPlacement)
)

const sameLogo = computed({
  get: () => !config.value.logoSecondary,
  set: (value: boolean) => {
    config.value.logoSecondary = value ? null : config.value.logoPrimary
  }
})
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <UiLabel>Logo placement</UiLabel>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="placement in placements"
          :key="placement.value"
          type="button"
          class="focus-visible:ring-ring flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          :class="
            config.logoPlacement === placement.value
              ? 'border-primary ring-primary/40 ring-1'
              : 'border-border hover:bg-muted'
          "
          @click="config.logoPlacement = placement.value"
        >
          <span class="flex h-10 items-center" aria-hidden="true">
            <template v-if="placement.value === 'left'">
              <span class="flex w-full items-center gap-1">
                <span
                  class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                >
                  <Icon :name="ICONS.image" class="size-3" />
                </span>
                <span class="bg-muted-foreground/30 h-2 flex-1 rounded-full" />
              </span>
            </template>
            <template v-else-if="placement.value === 'right'">
              <span class="flex w-full items-center gap-1">
                <span class="bg-muted-foreground/30 h-2 flex-1 rounded-full" />
                <span
                  class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                >
                  <Icon :name="ICONS.image" class="size-3" />
                </span>
              </span>
            </template>
            <template v-else-if="placement.value === 'center'">
              <span class="flex w-full flex-col items-center gap-1">
                <span class="flex gap-1">
                  <span
                    class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                  >
                    <Icon :name="ICONS.image" class="size-3" />
                  </span>
                  <span
                    class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                  >
                    <Icon :name="ICONS.image" class="size-3" />
                  </span>
                </span>
                <span class="bg-muted-foreground/30 h-2 w-4/5 rounded-full" />
              </span>
            </template>
            <template v-else>
              <span class="flex w-full items-center gap-1">
                <span
                  class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                >
                  <Icon :name="ICONS.image" class="size-3" />
                </span>
                <span class="bg-muted-foreground/30 h-2 flex-1 rounded-full" />
                <span
                  class="border-border bg-muted flex size-5 shrink-0 items-center justify-center rounded-sm border"
                >
                  <Icon :name="ICONS.image" class="size-3" />
                </span>
              </span>
            </template>
          </span>
          <span class="text-xs font-medium">{{ placement.label }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <ReportCardBuilderAssetUpload
        v-model="config.logoPrimary"
        asset-key="logo-primary"
        label="Primary logo"
      />

      <template v-if="showSecondaryLogo">
        <label class="text-muted-foreground flex items-center gap-2 text-xs">
          <UiCheckbox v-model="sameLogo" />
          Use the same logo for both slots
        </label>

        <ReportCardBuilderAssetUpload
          v-if="!sameLogo"
          v-model="config.logoSecondary"
          asset-key="logo-secondary"
          label="Secondary logo"
        />
      </template>
    </div>

    <UiSeparator />

    <ReportCardBuilderStyledTextInput
      v-model="config.schoolName"
      label="School name"
      placeholder="e.g. Springfield Secondary School"
    />
    <ReportCardBuilderStyledTextInput v-model="config.address" label="Address" multiline />
    <ReportCardBuilderStyledTextInput
      v-model="config.motto"
      label="Motto"
      placeholder="e.g. Knowledge and Integrity"
    />
    <ReportCardBuilderStyledTextInput
      v-model="config.extraText"
      label="Extra text"
      placeholder="e.g. Phone, email, website"
    />
  </div>
</template>
