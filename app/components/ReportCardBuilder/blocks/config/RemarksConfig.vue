<script lang="ts" setup>
import type { RemarksConfig, SignatureMode } from "~~/shared/constants/report-card"

const config = defineModel<RemarksConfig>({ required: true })

const signatureOptions: { value: SignatureMode; label: string }[] = [
  { value: "blank", label: "Blank line" },
  { value: "image", label: "Upload image" }
]

const parties = [
  { key: "teacher" as const, title: "Class teacher", assetKey: "sig-teacher" as const },
  { key: "principal" as const, title: "Principal", assetKey: "sig-principal" as const }
]
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="party in parties"
      :key="party.key"
      class="space-y-4 rounded-lg border border-border p-3"
    >
      <label class="flex items-center justify-between gap-3">
        <span class="text-sm font-medium">{{ party.title }}</span>
        <UiSwitch v-model="config[party.key].visible" :aria-label="`Show ${party.title} section`" />
      </label>

      <div v-if="config[party.key].visible" class="space-y-4">
        <ReportCardBuilderStyledTextInput
          v-model="config[party.key].label"
          label="Section heading"
        />

        <label class="flex items-center justify-between gap-3">
          <span class="text-sm">Show the comment</span>
          <UiSwitch
            v-model="config[party.key].showComment"
            :aria-label="`Show the ${party.title} comment`"
          />
        </label>

        <label class="flex items-center justify-between gap-3">
          <span class="text-sm">Include a signature</span>
          <UiSwitch
            v-model="config[party.key].showSignature"
            :aria-label="`Include the ${party.title} signature`"
          />
        </label>

        <template v-if="config[party.key].showSignature">
          <div class="space-y-2">
            <UiLabel>Signature style</UiLabel>
            <div class="flex items-center gap-1">
              <UiButton
                v-for="option in signatureOptions"
                :key="option.value"
                type="button"
                size="sm"
                :variant="config[party.key].signatureMode === option.value ? 'secondary' : 'ghost'"
                :text="option.label"
                @click="config[party.key].signatureMode = option.value"
              />
            </div>
          </div>

          <p
            v-if="config[party.key].signatureMode === 'blank' && !config[party.key].signatureImage"
            class="text-muted-foreground text-xs"
          >
            A blank signature line will be printed.
          </p>

          <ReportCardBuilderAssetUpload
            v-model="config[party.key].signatureImage"
            :asset-key="party.assetKey"
            label="Signature image"
          />

          <ReportCardBuilderStyledTextInput
            v-model="config[party.key].signatureLabel"
            label="Name under the signature"
          />
        </template>
      </div>
    </div>
  </div>
</template>
