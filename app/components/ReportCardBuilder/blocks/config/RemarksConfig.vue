<script lang="ts" setup>
import type { LabelPlacement, RemarksConfig, SignatureMode } from "~~/shared/constants/report-card"

const config = defineModel<RemarksConfig>({ required: true })

const signatureOptions: { value: SignatureMode; label: string }[] = [
  { value: "blank", label: "Blank line" },
  { value: "image", label: "Upload image" }
]

const placementOptions: { value: LabelPlacement; label: string }[] = [
  { value: "top", label: "Label above the comment" },
  { value: "side", label: "Label beside the comment" }
]

const parties = [
  { key: "teacher" as const, title: "Class teacher", assetKey: "sig-teacher" as const },
  { key: "principal" as const, title: "Principal", assetKey: "sig-principal" as const }
]
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="party in parties"
      :key="party.key"
      class="space-y-3 rounded-lg border border-border p-2.5"
    >
      <label class="flex items-center justify-between gap-3">
        <span class="text-xs font-medium">{{ party.title }}</span>
        <UiSwitch v-model="config[party.key].visible" :aria-label="`Show ${party.title} section`" />
      </label>

      <div v-if="config[party.key].visible" class="space-y-3">
        <ReportCardBuilderStyledTextInput
          v-model="config[party.key].label"
          label="Section heading"
          :min-size="9"
          :max-size="14"
        />

        <div class="space-y-1.5">
          <UiLabel class="text-xs">Comment label</UiLabel>
          <ReportCardBuilderSmallSelect
            v-model="config[party.key].commentLabelPlacement"
            :options="placementOptions"
          />
        </div>

        <label class="flex items-center justify-between gap-3">
          <span class="text-xs">Include a signature</span>
          <UiSwitch
            v-model="config[party.key].showSignature"
            :aria-label="`Include the ${party.title} signature`"
          />
        </label>

        <template v-if="config[party.key].showSignature">
          <div class="space-y-1.5">
            <UiLabel class="text-xs">Signature style</UiLabel>
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
            class="text-muted-foreground text-[10px]"
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
            :min-size="8"
            :max-size="12"
          />
        </template>
      </div>
    </div>
  </div>
</template>
