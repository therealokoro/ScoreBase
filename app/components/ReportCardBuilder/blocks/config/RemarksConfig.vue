<script lang="ts" setup>
import type { RemarksConfig, SignatureMode } from "~~/shared/constants/report-card"

const config = defineModel<RemarksConfig>({ required: true })

const signatureOptions: { value: SignatureMode; label: string }[] = [
  { value: "blank", label: "Blank line" },
  { value: "image", label: "Upload image" }
]
</script>

<template>
  <div class="space-y-4">
    <!-- Class teacher: signature on the left, comment on the right of the same line -->
    <div class="space-y-3 rounded-lg border border-border p-2.5">
      <label class="flex items-center justify-between gap-3">
        <span class="text-xs font-medium">Class teacher</span>
        <UiSwitch v-model="config.teacher.visible" aria-label="Show the class teacher section" />
      </label>

      <div v-if="config.teacher.visible" class="space-y-3">
        <ReportCardBuilderStyledTextInput
          v-model="config.teacher.label"
          label="Comment label"
          :min-size="9"
          :max-size="14"
        />

        <label class="flex items-center justify-between gap-3">
          <span class="text-xs">Include a signature</span>
          <UiSwitch
            v-model="config.teacher.showSignature"
            aria-label="Include the class teacher signature"
          />
        </label>

        <template v-if="config.teacher.showSignature">
          <div class="space-y-1.5">
            <UiLabel class="text-xs">Signature style</UiLabel>
            <div class="flex items-center gap-1">
              <UiButton
                v-for="option in signatureOptions"
                :key="option.value"
                type="button"
                size="sm"
                :variant="config.teacher.signatureMode === option.value ? 'secondary' : 'ghost'"
                :text="option.label"
                @click="config.teacher.signatureMode = option.value"
              />
            </div>
          </div>

          <p
            v-if="config.teacher.signatureMode === 'blank' && !config.teacher.signatureImage"
            class="text-muted-foreground text-[10px]"
          >
            A blank signature line will be printed.
          </p>

          <ReportCardBuilderAssetUpload
            v-model="config.teacher.signatureImage"
            asset-key="sig-teacher"
            label="Signature image"
          />

          <ReportCardBuilderStyledTextInput
            v-model="config.teacher.signatureLabel"
            label="Name under the signature"
            :min-size="8"
            :max-size="12"
          />
        </template>
      </div>
    </div>

    <!--
      Head signature. Principal and director are the same person, so this is one slot — name it
      "Director:" or "Principal:" per school.
    -->
    <div class="space-y-3 rounded-lg border border-border p-2.5">
      <label class="flex items-center justify-between gap-3">
        <span class="text-xs font-medium">Head signature</span>
        <UiSwitch v-model="config.director.visible" aria-label="Show the head signature" />
      </label>

      <p class="text-muted-foreground text-[10px]">
        The principal and the director are one person here — label this slot with whichever title
        the school uses.
      </p>

      <div v-if="config.director.visible" class="space-y-3">
        <ReportCardBuilderStyledTextInput
          v-model="config.director.signatureLabel"
          label="Name under the signature"
          :min-size="8"
          :max-size="12"
        />

        <label class="flex items-center justify-between gap-3">
          <span class="text-xs">Include a signature</span>
          <UiSwitch
            v-model="config.director.showSignature"
            aria-label="Include the head signature"
          />
        </label>

        <template v-if="config.director.showSignature">
          <div class="space-y-1.5">
            <UiLabel class="text-xs">Signature style</UiLabel>
            <div class="flex items-center gap-1">
              <UiButton
                v-for="option in signatureOptions"
                :key="option.value"
                type="button"
                size="sm"
                :variant="config.director.signatureMode === option.value ? 'secondary' : 'ghost'"
                :text="option.label"
                @click="config.director.signatureMode = option.value"
              />
            </div>
          </div>

          <p
            v-if="config.director.signatureMode === 'blank' && !config.director.signatureImage"
            class="text-muted-foreground text-[10px]"
          >
            A blank signature line will be printed.
          </p>

          <ReportCardBuilderAssetUpload
            v-model="config.director.signatureImage"
            asset-key="sig-principal"
            label="Signature image"
          />
        </template>
      </div>
    </div>
  </div>
</template>
