<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type {
  InfoField,
  LogoPlacement,
  ReportCardTemplate,
  TextAlign
} from "~~/shared/constants/kv-settings"

const model = defineModel<ReportCardTemplate>("template", { required: true })

const placements: { value: LogoPlacement; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" },
  { value: "left-right", label: "Both sides" }
]

const alignOptions: { value: TextAlign; icon: string }[] = [
  { value: "left", icon: ICONS.alignLeft },
  { value: "center", icon: ICONS.alignCenter },
  { value: "right", icon: ICONS.alignRight }
]

const infoLabels: Record<InfoField, string> = {
  student: "Student name",
  class: "Class",
  session: "Session",
  term: "Term"
}

const showSecondaryLogo = computed(() =>
  ["center", "left-right"].includes(model.value.header.logoPlacement)
)

const sameLogo = ref(false)
watch([sameLogo, () => model.value.header.logoPrimary], () => {
  if (sameLogo.value) model.value.header.logoSecondary = model.value.header.logoPrimary
})

const watermarkPercent = computed({
  get: () => Math.round(model.value.header.watermarkOpacity * 100),
  set: (value: number) => {
    model.value.header.watermarkOpacity = value / 100
  }
})

const openColorId = ref<string | null>(null)

function addParagraph() {
  model.value.header.paragraphs.push({
    id: typeid("para").toString(),
    text: "",
    fontSize: 14,
    color: "#000000",
    bold: false,
    align: "left"
  })
}

function removeParagraph(index: number) {
  model.value.header.paragraphs.splice(index, 1)
}

function moveParagraph(index: number, direction: -1 | 1) {
  const target = index + direction
  const list = model.value.header.paragraphs
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  if (item) list.splice(target, 0, item)
}

function moveInfo(index: number, direction: -1 | 1) {
  const order = model.value.header.info.order
  const target = index + direction
  if (target < 0 || target >= order.length) return
  const [item] = order.splice(index, 1)
  if (item) order.splice(target, 0, item)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Logo placement -->
    <section class="space-y-3">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Logo placement</UiHeading>
        <p class="text-xs text-muted-foreground">
          Choose where the school logo appears in the header.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="placement in placements"
          :key="placement.value"
          type="button"
          class="focus-visible:ring-ring flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          :class="
            model.header.logoPlacement === placement.value
              ? 'border-primary ring-primary/40 ring-1'
              : 'border-border hover:bg-muted'
          "
          @click="model.header.logoPlacement = placement.value"
        >
          <!-- Tiny diagram -->
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

      <div class="space-y-3">
        <ReportCardBuilderAssetUpload
          v-model="model.header.logoPrimary"
          asset-key="logo-primary"
          label="Primary logo"
        />

        <template v-if="showSecondaryLogo">
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <UiCheckbox v-model="sameLogo" />
            Use the same logo for both slots
          </label>

          <ReportCardBuilderAssetUpload
            v-if="!sameLogo"
            v-model="model.header.logoSecondary"
            asset-key="logo-secondary"
            label="Secondary logo"
          />
        </template>
      </div>

      <!-- Watermark -->
      <div v-if="model.header.logoPrimary" class="space-y-4 rounded-lg border border-border p-3">
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium">Watermark</span>
          <UiSwitch v-model="model.header.showWatermark" aria-label="Show logo watermark" />
        </label>

        <div v-if="model.header.showWatermark" class="flex items-center gap-3">
          <span class="w-20 text-xs text-muted-foreground">Opacity</span>
          <UiSlider
            :model-value="[watermarkPercent]"
            :min="0"
            :max="100"
            :step="1"
            @update:model-value="(v) => (watermarkPercent = v?.[0] ?? 0)"
          />
          <span class="w-10 text-right text-xs tabular-nums">{{ watermarkPercent }}%</span>
        </div>
      </div>
    </section>

    <UiSeparator />

    <!-- Heading -->
    <section class="space-y-4">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Headings</UiHeading>
        <p class="text-xs text-muted-foreground">Titles printed at the top of the report card.</p>
      </div>

      <div class="space-y-2">
        <UiLabel for="rc-heading">Main heading</UiLabel>
        <UiInput
          id="rc-heading"
          v-model="model.header.heading"
          placeholder="e.g. Springfield Secondary School"
        />
      </div>

      <div class="space-y-2">
        <UiLabel for="rc-subheading">Sub-heading</UiLabel>
        <UiInput
          id="rc-subheading"
          v-model="model.header.subheading"
          placeholder="e.g. Terminal Report Sheet"
        />
      </div>
    </section>

    <UiSeparator />

    <!-- Paragraphs -->
    <section class="space-y-3">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Paragraphs</UiHeading>
        <p class="text-xs text-muted-foreground">Free text blocks shown under the heading.</p>
      </div>

      <UiEmpty
        v-if="model.header.paragraphs.length === 0"
        :icon="ICONS.document"
        title="No paragraphs yet"
        description="Add a paragraph for extra header text such as a motto or address."
        button-text="Add paragraph"
        @button-action="addParagraph"
      />

      <div v-else class="space-y-3">
        <div
          v-for="(paragraph, index) in model.header.paragraphs"
          :key="paragraph.id"
          class="space-y-3 rounded-lg border border-border p-3"
        >
          <div class="flex items-start gap-2">
            <UiTextarea
              v-model="paragraph.text"
              :rows="2"
              placeholder="Paragraph text"
              class="flex-1 text-sm"
            />
            <div class="flex flex-col gap-1">
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
                :disabled="index === model.header.paragraphs.length - 1"
                @click="moveParagraph(index, 1)"
              />
              <UiButton
                type="button"
                variant="ghost"
                size="icon-sm"
                :icon="ICONS.delete"
                :label="`Delete paragraph ${index + 1}`"
                class="text-destructive"
                @click="removeParagraph(index)"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <div class="flex min-w-44 items-center gap-2">
              <span class="text-xs text-muted-foreground">Size</span>
              <UiSlider
                :model-value="[paragraph.fontSize]"
                :min="10"
                :max="24"
                :step="1"
                @update:model-value="(v) => (paragraph.fontSize = v?.[0] ?? 14)"
              />
              <span class="w-6 text-right text-xs tabular-nums">{{ paragraph.fontSize }}</span>
            </div>

            <label class="flex items-center gap-2">
              <UiSwitch v-model="paragraph.bold" :aria-label="`Bold paragraph ${index + 1}`" />
              <span class="text-xs text-muted-foreground">Bold</span>
            </label>

            <div class="flex items-center gap-1">
              <UiButton
                v-for="option in alignOptions"
                :key="option.value"
                type="button"
                :variant="paragraph.align === option.value ? 'secondary' : 'ghost'"
                size="icon-sm"
                :icon="option.icon"
                :label="`Align ${option.value}`"
                @click="paragraph.align = option.value"
              />
            </div>

            <button
              type="button"
              class="border-border size-7 shrink-0 rounded-md border shadow-xs"
              :style="{ backgroundColor: paragraph.color }"
              :aria-label="`Paragraph ${index + 1} colour`"
              :aria-expanded="openColorId === paragraph.id"
              @click="openColorId = openColorId === paragraph.id ? null : paragraph.id"
            />
          </div>

          <div v-if="openColorId === paragraph.id" class="rounded-md border border-border p-2">
            <UiColorPicker
              v-model="paragraph.color"
              :show-format-toggle="false"
              :show-result="false"
              :show-presets="false"
            />
          </div>
        </div>

        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add paragraph"
          @click="addParagraph"
        />
      </div>
    </section>

    <UiSeparator />

    <!-- Student info -->
    <section class="space-y-3">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Student information</UiHeading>
        <p class="text-xs text-muted-foreground">
          Choose which fields appear and the order they are shown in.
        </p>
      </div>

      <div class="space-y-2">
        <div
          v-for="(field, index) in model.header.info.order"
          :key="field"
          class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
        >
          <label class="flex items-center gap-3">
            <UiSwitch
              v-model="model.header.info[field]"
              :aria-label="`Show ${infoLabels[field]}`"
            />
            <span class="text-sm">{{ infoLabels[field] }}</span>
          </label>

          <div class="flex items-center gap-1">
            <UiButton
              type="button"
              variant="ghost"
              size="icon-sm"
              :icon="ICONS.up"
              :label="`Move ${infoLabels[field]} up`"
              :disabled="index === 0"
              @click="moveInfo(index, -1)"
            />
            <UiButton
              type="button"
              variant="ghost"
              size="icon-sm"
              :icon="ICONS.down"
              :label="`Move ${infoLabels[field]} down`"
              :disabled="index === model.header.info.order.length - 1"
              @click="moveInfo(index, 1)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
