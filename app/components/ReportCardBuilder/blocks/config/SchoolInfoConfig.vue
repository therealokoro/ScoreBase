<script lang="ts" setup>
import type { LogoPlacement, SchoolInfoConfig, StyledText } from "~~/shared/constants/report-card"
import { DEFAULT_TEXT_STYLE } from "~~/shared/constants/report-card"
import { ICONS } from "~~/shared/constants/icons"

const config = defineModel<SchoolInfoConfig>({ required: true })

const placements: { value: LogoPlacement; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" },
  { value: "left-right", label: "Both sides" }
]

const logoSizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" }
]

const showSecondaryLogo = computed(() =>
  ["center", "left-right"].includes(config.value.logoPlacement)
)

const sameLogo = computed({
  // Checked only when the secondary slot actually mirrors the primary — so an empty
  // secondary keeps its upload field visible.
  get: () =>
    config.value.logoSecondary !== null && config.value.logoSecondary === config.value.logoPrimary,
  set: (value: boolean) => {
    config.value.logoSecondary = value ? config.value.logoPrimary : null
  }
})

function addParagraph() {
  const paragraph: StyledText = { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11 } }
  config.value.paragraphs.push(paragraph)
}

function removeParagraph(index: number) {
  config.value.paragraphs.splice(index, 1)
}

function moveParagraph(index: number, direction: -1 | 1) {
  const target = index + direction
  const paragraphs = config.value.paragraphs
  if (target < 0 || target >= paragraphs.length) return
  const [item] = paragraphs.splice(index, 1)
  if (item) paragraphs.splice(target, 0, item)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <UiLabel class="text-xs">Logo placement</UiLabel>
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

    <div class="space-y-1.5">
      <UiLabel class="text-xs">Logo size</UiLabel>
      <ReportCardBuilderSmallSelect v-model="config.logoSize" :options="logoSizeOptions" />
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
      :min-size="12"
      :max-size="22"
    />

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <UiLabel class="text-xs">Paragraphs</UiLabel>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add"
          @click="addParagraph"
        />
      </div>

      <p v-if="config.paragraphs.length === 0" class="text-muted-foreground text-[10px]">
        No paragraphs yet — add address, motto, contact details or any other header text.
      </p>

      <div
        v-for="(paragraph, index) in config.paragraphs"
        :key="index"
        class="space-y-2 rounded-md border border-border p-2"
      >
        <ReportCardBuilderStyledTextInput
          v-model="config.paragraphs[index]!"
          placeholder="Paragraph text"
          :min-size="8"
          :max-size="16"
        />
        <div class="flex items-center justify-end gap-1">
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.up"
            :label="`Move paragraph ${index + 1} up`"
            :disabled="index === 0"
            @click="moveParagraph(index, -1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.down"
            :label="`Move paragraph ${index + 1} down`"
            :disabled="index === config.paragraphs.length - 1"
            @click="moveParagraph(index, 1)"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon-sm"
            :icon="ICONS.delete"
            :label="`Remove paragraph ${index + 1}`"
            class="text-destructive"
            @click="removeParagraph(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
