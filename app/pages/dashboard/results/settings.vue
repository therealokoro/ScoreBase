<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"
import {
  DEFAULT_GRADE_BOUNDARIES,
  DEFAULT_RESULT_SETTINGS,
  type PositionDisplayOption
} from "~~/shared/constants/kv-settings"

definePageMeta({ middleware: ["admin-only"] })

const { data: settings, refetch } = useGetResultSettings()
const setSettings = useUpdateResultSettings()

// Helpers — transform between KV shape and FormKit shape
// ---------------------------------------------------------------------------

function toFormShape(s: typeof DEFAULT_RESULT_SETTINGS) {
  // Build scoreDistribution group value from caMaxScores[] + examMax
  const scoreDistribution: Record<string, number> = { exam: s.examMax }
  s.caMaxScores.forEach((val, i) => {
    scoreDistribution[`ca_${i}`] = val
  })

  return {
    caCount: s.caCount,
    scoreDistribution,
    positionDisplayMode: s.positionDisplayMode,
    positionTopN: s.positionTopN
    // gradeBoundaries intentionally excluded — handled by its own
    // decoupled ref (gradeBoundaryRows) below, not by formData
  }
}

// Local mutable form model — always has a valid shape for FormKit
const formData = ref(toFormShape(DEFAULT_RESULT_SETTINGS))

// Grade boundaries live in their own ref, fully decoupled from formData,
// so adding/removing/resetting rows never reassigns into FormKit's
// internal readonly proxy (see addGradeBoundary etc. below)
const gradeBoundaryRows = ref([...DEFAULT_GRADE_BOUNDARIES])
const gradeBoundaryRenderKey = ref(0)

// Sync stored settings to local settings variable when the query resolves
watch(
  settings,
  (val) => {
    if (!val) return
    formData.value = toFormShape(val)
    gradeBoundaryRows.value = [...val.gradeBoundaries]
  },
  { immediate: true }
)

// Submit — transform FormKit shape back to KV shape
// ---------------------------------------------------------------------------

function handleSubmit(payload: any) {
  const { caCount, scoreDistribution, gradeBoundaries, ...rest } = payload
  // Rebuilds the ca_0, ca_1... entries from the scoreDistribution object into an ordered caMaxScores[] array (sorted by index), separate from examMax.
  const caMaxScores = Object.entries(scoreDistribution)
    .filter(([key]) => key.startsWith("ca_"))
    .sort(([a], [b]) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    .map(([_, val]) => Number(val))
  const examMax = Number(scoreDistribution.exam)

  useSonner.promise(
    setSettings.mutateAsync({
      ...rest,
      caCount: Number(caCount),
      caMaxScores,
      examMax,
      gradeBoundaries
    }),
    {
      loading: "Updating result settings, please wait...",
      success: () => {
        refetch()
        return "Result settings updated successfully"
      },
      error: (e: any) => e.message
    }
  )
}

// Position display
// ---------------------------------------------------------------------------
const showTopN = computed(() => formData.value.positionDisplayMode === "top")
const positionDisplayOptions: PositionDisplayOption[] = [
  { value: "all", label: "Show for all students" },
  { value: "top", label: "Show for top N students only" },
  { value: "none", label: "Never show position" }
]

// Grade boundaries
// ---------------------------------------------------------------------------
// Adds a new empty grade boundary row
function addGradeBoundary() {
  gradeBoundaryRows.value = [...gradeBoundaryRows.value, { label: "", min: 0, max: 0, remark: "" }]
  gradeBoundaryRenderKey.value++
}

// Removes a grade boundary row by index
function removeGradeBoundary(index: number) {
  gradeBoundaryRows.value = gradeBoundaryRows.value.filter((_, i) => i !== index)
  gradeBoundaryRenderKey.value++
}

// Resets grade boundaries back to the default scale
function resetGradeBoundaries() {
  gradeBoundaryRows.value = [...DEFAULT_GRADE_BOUNDARIES]
  gradeBoundaryRenderKey.value++
}
</script>

<template>
  <Page
    title="Result Settings"
    description="Manage grading, score distribution, and report card preferences"
  >
    <UiSeparator />

    <div class="w-full">
      <FormKit type="form" v-model="formData" :actions="false" @submit="handleSubmit">
        <fieldset class="space-y-10" :disabled="setSettings.isPending.value">
          <!-- Score Distribution -->
          <div class="space-y-4">
            <div class="space-y-1">
              <ui-heading class="font-semibold" :level="6">Score Distribution</ui-heading>
              <p class="text-xs text-muted-foreground">
                Set the number of CAs and their individual max scores. All values must sum to 100.
              </p>
            </div>

            <!-- Distribution Inputs -->
            <div class="md:max-w-lg space-y-4">
              <FormKit
                type="number"
                name="caCount"
                label="Number of CAs"
                placeholder="e.g 3"
                min="1"
                max="5"
                help="Total number of CAs students take per subject"
                validation="required|between:1,5"
                validation-visibility="live"
                :validation-messages="{
                  required: 'Required',
                  between: 'Must be between 1 and 5'
                }"
              />

              <SettingsScoreDistributionInput :ca-count="formData.caCount" />
            </div>
          </div>

          <UiSeparator />

          <!-- Class Position -->
          <div class="space-y-4">
            <div class="space-y-1">
              <ui-heading class="font-semibold" :level="6">Class Position</ui-heading>
              <p class="text-xs text-muted-foreground">
                Control how student positions appear on report cards
              </p>
            </div>
            <div class="md:max-w-md space-y-4">
              <FormKit
                type="_select"
                name="positionDisplayMode"
                label="Position Display"
                placeholder="Select display mode"
                help="Decide how students positions should be displayed"
                :options="positionDisplayOptions"
              />
              <FormKit
                v-if="showTopN"
                type="number"
                name="positionTopN"
                label="Top N"
                placeholder="e.g 3"
                min="1"
                validation="required|min:1"
                help="Only students ranked within this number will have their position shown"
              />
            </div>
          </div>

          <UiSeparator />

          <!-- Grading Scale -->
          <div class="space-y-4">
            <div class="space-y-1">
              <ui-heading class="font-semibold" :level="6">Grading Scale</ui-heading>
              <p class="text-xs text-muted-foreground">
                Define grade boundaries. Each boundary maps a score range to a grade label.
              </p>
            </div>

            <!-- Header row -->
            <div class="hidden md:grid grid-cols-[96px_96px_96px_1fr_32px] gap-3 px-1 mb-1">
              <span class="text-xs text-muted-foreground">Grade</span>
              <span class="text-xs text-muted-foreground">Min</span>
              <span class="text-xs text-muted-foreground">Max</span>
              <span class="text-xs text-muted-foreground">Remark</span>
              <span />
            </div>

            <!-- Actual Inputs — :value + :key on the list lets it remount cleanly
                 whenever gradeBoundaryRows changes length, instead of writing
                 into FormKit's internal array directly -->
            <div class="relative space-y-3">
              <FormKit
                type="list"
                name="gradeBoundaries"
                :value="gradeBoundaryRows"
                :key="gradeBoundaryRenderKey"
              >
                <FormKit v-for="(boundary, index) in gradeBoundaryRows" :key="index" type="group">
                  <div class="flex items-end gap-3">
                    <FormKit
                      type="text"
                      name="label"
                      :placeholder="boundary.label || 'e.g A'"
                      validation="required"
                      :classes="{ outer: 'mb-0 w-20 md:w-24', input: 'text-xs md:text-sm' }"
                      :validation-messages="{ required: 'Required' }"
                      validation-visibility="dirty"
                    />
                    <FormKit
                      type="number"
                      name="min"
                      :placeholder="String(boundary.min ?? 0)"
                      min="0"
                      max="100"
                      validation="required|between:0,100"
                      :classes="{ outer: 'mb-0 w-20 md:w-24', input: 'text-xs md:text-sm' }"
                      :validation-messages="{ required: 'Required' }"
                      validation-visibility="dirty"
                    />
                    <FormKit
                      type="number"
                      name="max"
                      :placeholder="String(boundary.max ?? 100)"
                      min="0"
                      max="100"
                      validation="required|between:0,100"
                      :classes="{ outer: 'mb-0 w-20 md:w-24', input: 'text-xs md:text-sm' }"
                      :validation-messages="{ required: 'Required' }"
                      validation-visibility="dirty"
                    />
                    <FormKit
                      type="text"
                      name="remark"
                      :placeholder="boundary.remark || 'e.g Excellent'"
                      validation="required"
                      :classes="{
                        outer: 'mb-0 w-min min-w-25 md:w-40',
                        input: 'text-xs md:text-sm'
                      }"
                      :validation-messages="{ required: 'Required' }"
                      validation-visibility="dirty"
                    />

                    <div class="absolute right-0 lg:relative">
                      <UiButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        :icon="ICONS.delete"
                        class="text-destructive mb-1 shrink-0"
                        @click="removeGradeBoundary(index)"
                      />
                    </div>
                  </div>
                </FormKit>
              </FormKit>
            </div>

            <!-- Helper buttons -->
            <div class="flex items-center gap-3">
              <UiButton
                type="button"
                variant="outline"
                size="sm"
                text="Add Grade"
                :icon="ICONS.add"
                @click="addGradeBoundary"
              />

              <UiButton
                type="button"
                variant="outline"
                size="sm"
                icon="lucide:timer-reset"
                text="Reset to Default"
                @click="resetGradeBoundaries"
              />
            </div>
          </div>

          <!-- Submit button -->
          <UiButton
            :loading="setSettings.isPending.value"
            type="submit"
            :icon="ICONS.settings"
            text="Save Result Settings"
            class="h-10"
          />
        </fieldset>
      </FormKit>
    </div>
  </Page>
</template>
