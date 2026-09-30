<script lang="ts" setup>
import { typeid } from "typeid-js"
import { ICONS } from "~~/shared/constants/icons"
import type { ReportCardTemplate } from "~~/shared/constants/report-card"

const model = defineModel<ReportCardTemplate>("template", { required: true })

// Phase 6: the template became a slot + block shape; this legacy fixed-shape view is kept
// ONLY so the old section UI keeps compiling until Phase 10 replaces it. Every reference to
// `legacy` below is a known-stale code path.
type LegacyTemplate = {
  summary: {
    placement: "header" | "footer"
    total: boolean
    average: boolean
    position: boolean
    outOf: boolean
  }
  footer: {
    remarks: {
      show: boolean
      teacher: { show: boolean; label: string; signature: boolean; signatureImage: string | null }
      principal: { show: boolean; label: string; signature: boolean; signatureImage: string | null }
    }
    classSummary: { show: boolean; highest: boolean; lowest: boolean; average: boolean }
    customBlocks: { id: string; label: string; content: string }[]
  }
}

const legacy = computed(() => model.value as unknown as LegacyTemplate)

const summaryFields: {
  key: "total" | "average" | "position" | "outOf"
  label: string
}[] = [
  { key: "total", label: "Total score" },
  { key: "average", label: "Average" },
  { key: "position", label: "Position" },
  { key: "outOf", label: "Out of" }
]

const classSummaryFields: {
  key: "highest" | "lowest" | "average"
  label: string
}[] = [
  { key: "highest", label: "Highest score" },
  { key: "lowest", label: "Lowest score" },
  { key: "average", label: "Class average" }
]

function addBlock() {
  legacy.value.footer.customBlocks.push({ id: typeid("block").toString(), label: "", content: "" })
}

function removeBlock(index: number) {
  legacy.value.footer.customBlocks.splice(index, 1)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Result summary -->
    <section class="space-y-4">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Result Summary</UiHeading>
        <p class="text-xs text-muted-foreground">
          Where the total, average, and position are shown.
        </p>
      </div>

      <UiRadioGroup v-model="legacy.summary.placement" class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <UiRadioGroupItem value="header" />
          Show in header
        </label>
        <label class="flex items-center gap-2 text-sm">
          <UiRadioGroupItem value="footer" />
          Show in footer
        </label>
      </UiRadioGroup>

      <div class="space-y-2">
        <div
          v-for="field in summaryFields"
          :key="field.key"
          class="flex items-center justify-between rounded-md border border-border px-3 py-2"
        >
          <span class="text-sm">{{ field.label }}</span>
          <UiSwitch v-model="legacy.summary[field.key]" :aria-label="`Show ${field.label}`" />
        </div>
      </div>
    </section>

    <UiSeparator />

    <!-- Remarks -->
    <section class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <UiHeading :level="6" class="font-semibold">Remarks</UiHeading>
          <p class="text-xs text-muted-foreground">
            Teacher and principal comments with signatures.
          </p>
        </div>
        <UiSwitch v-model="legacy.footer.remarks.show" aria-label="Show remarks" />
      </div>

      <div
        class="space-y-6"
        :class="!legacy.footer.remarks.show && 'pointer-events-none opacity-50'"
      >
        <!-- Teacher -->
        <div class="space-y-3 rounded-lg border border-border p-3">
          <label class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium">Class teacher</span>
            <UiSwitch
              v-model="legacy.footer.remarks.teacher.show"
              aria-label="Show teacher remark"
            />
          </label>

          <div v-if="legacy.footer.remarks.teacher.show" class="space-y-3">
            <div class="space-y-2">
              <UiLabel for="rc-teacher-label">Label</UiLabel>
              <UiInput
                id="rc-teacher-label"
                v-model="legacy.footer.remarks.teacher.label"
                placeholder="e.g. Class Teacher"
              />
            </div>

            <label class="flex items-center justify-between gap-3">
              <span class="text-sm">Include signature</span>
              <UiSwitch
                v-model="legacy.footer.remarks.teacher.signature"
                aria-label="Include teacher signature"
              />
            </label>

            <template v-if="legacy.footer.remarks.teacher.signature">
              <p
                v-if="!legacy.footer.remarks.teacher.signatureImage"
                class="text-xs text-muted-foreground"
              >
                A blank signature line will be printed.
              </p>
              <ReportCardBuilderAssetUpload
                v-model="legacy.footer.remarks.teacher.signatureImage"
                asset-key="sig-teacher"
                label="Teacher signature"
              />
            </template>
          </div>
        </div>

        <!-- Principal -->
        <div class="space-y-3 rounded-lg border border-border p-3">
          <label class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium">Principal</span>
            <UiSwitch
              v-model="legacy.footer.remarks.principal.show"
              aria-label="Show principal remark"
            />
          </label>

          <div v-if="legacy.footer.remarks.principal.show" class="space-y-3">
            <div class="space-y-2">
              <UiLabel for="rc-principal-label">Label</UiLabel>
              <UiInput
                id="rc-principal-label"
                v-model="legacy.footer.remarks.principal.label"
                placeholder="e.g. Principal"
              />
            </div>

            <label class="flex items-center justify-between gap-3">
              <span class="text-sm">Include signature</span>
              <UiSwitch
                v-model="legacy.footer.remarks.principal.signature"
                aria-label="Include principal signature"
              />
            </label>

            <template v-if="legacy.footer.remarks.principal.signature">
              <p
                v-if="!legacy.footer.remarks.principal.signatureImage"
                class="text-xs text-muted-foreground"
              >
                A blank signature line will be printed.
              </p>
              <ReportCardBuilderAssetUpload
                v-model="legacy.footer.remarks.principal.signatureImage"
                asset-key="sig-principal"
                label="Principal signature"
              />
            </template>
          </div>
        </div>
      </div>
    </section>

    <UiSeparator />

    <!-- Class summary -->
    <section class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <UiHeading :level="6" class="font-semibold">Class Summary</UiHeading>
          <p class="text-xs text-muted-foreground">
            Class-wide statistics shown on the report card.
          </p>
        </div>
        <UiSwitch v-model="legacy.footer.classSummary.show" aria-label="Show class summary" />
      </div>

      <div
        class="space-y-2"
        :class="!legacy.footer.classSummary.show && 'pointer-events-none opacity-50'"
      >
        <div
          v-for="field in classSummaryFields"
          :key="field.key"
          class="flex items-center justify-between rounded-md border border-border px-3 py-2"
        >
          <span class="text-sm">{{ field.label }}</span>
          <UiSwitch
            v-model="legacy.footer.classSummary[field.key]"
            :aria-label="`Show ${field.label}`"
          />
        </div>
      </div>
    </section>

    <UiSeparator />

    <!-- Custom blocks -->
    <section class="space-y-3">
      <div class="space-y-1">
        <UiHeading :level="6" class="font-semibold">Custom Info Blocks</UiHeading>
        <p class="text-xs text-muted-foreground">
          Arbitrary content such as "Next term begins" or resumption dates.
        </p>
      </div>

      <UiEmpty
        v-if="legacy.footer.customBlocks.length === 0"
        :icon="ICONS.document"
        title="No custom blocks"
        description="Add a block for extra information at the bottom of the report card."
        button-text="Add block"
        @button-action="addBlock"
      />

      <div v-else class="space-y-3">
        <div
          v-for="(block, index) in legacy.footer.customBlocks"
          :key="block.id"
          class="space-y-3 rounded-lg border border-border p-3"
        >
          <div class="flex items-center gap-2">
            <UiInput v-model="block.label" placeholder="Block label" class="flex-1" />
            <UiButton
              type="button"
              variant="ghost"
              size="icon-sm"
              :icon="ICONS.delete"
              :label="`Delete block ${index + 1}`"
              class="text-destructive"
              @click="removeBlock(index)"
            />
          </div>
          <UiTextarea
            v-model="block.content"
            :rows="2"
            placeholder="Block content"
            class="text-sm"
          />
        </div>

        <UiButton
          type="button"
          variant="outline"
          size="sm"
          :icon="ICONS.add"
          text="Add block"
          @click="addBlock"
        />
      </div>
    </section>
  </div>
</template>
