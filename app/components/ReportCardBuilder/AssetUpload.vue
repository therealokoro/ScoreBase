<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import type { ReportCardAssetKey } from "~~/shared/constants/report-card"

const props = defineProps<{
  assetKey: ReportCardAssetKey
  label?: string
}>()

const model = defineModel<string | null>({ default: null })

const MAX_FILE_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp"

const fileInputRef = useTemplateRef("fileInput")
const isUploading = ref(false)
const upload = useUploadReportCardAsset()

const imageUrl = computed(() => (model.value ? `/images/${model.value}` : null))

function pickFile() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > MAX_FILE_BYTES) {
    useSonner.error("Image must be 2MB or smaller.")
    input.value = ""
    return
  }

  isUploading.value = true
  try {
    // Phase 6 widened ReportCardAssetKey with a "watermark" key; the contract enum gains that
    // value in Phase 10 (watermark uploads), so this stays a no-op cast until then.
    const { url } = await upload.mutateAsync({
      assetKey: props.assetKey as
        | "logo-primary"
        | "logo-secondary"
        | "sig-teacher"
        | "sig-principal",
      file
    })
    model.value = url
  } catch (error) {
    useSonner.error((error as Error).message || "Upload failed. Please try again.")
  } finally {
    isUploading.value = false
    input.value = ""
  }
}
</script>

<template>
  <div class="space-y-2">
    <UiLabel v-if="label">{{ label }}</UiLabel>

    <div v-if="imageUrl" class="relative inline-flex">
      <img
        :src="imageUrl"
        :alt="label ?? 'Uploaded image'"
        class="h-16 w-auto max-w-32 rounded-md border border-border bg-background object-contain p-1"
      />
      <UiButton
        type="button"
        variant="outline"
        size="icon-xs"
        :icon="ICONS.close"
        :label="`Remove ${label ?? 'image'}`"
        class="absolute -top-2 -right-2 bg-background"
        @click="model = null"
      />
    </div>

    <button
      v-else
      type="button"
      class="border-border text-muted-foreground hover:bg-muted flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50"
      :disabled="isUploading"
      @click="pickFile"
    >
      <Icon
        :name="isUploading ? ICONS.loading : ICONS.upload"
        class="size-4"
        :class="isUploading && 'animate-spin'"
      />
      <span>{{ isUploading ? "Uploading..." : (label ?? "Upload image") }}</span>
    </button>

    <input
      ref="fileInput"
      type="file"
      :accept="ACCEPTED_TYPES"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
