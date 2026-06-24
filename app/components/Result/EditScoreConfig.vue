<script lang="ts" setup>
type ScoreConfig = {
  caCount: number
  caMaxScores: number[]
  examMax: number
}

const props = defineProps<{
  resultId: string
  scoreConfig: ScoreConfig
}>()

const scoreConfig = computed(() => props.scoreConfig)
const emit = defineEmits<{ submit: [] }>()
const isSheetOpen = defineModel<boolean>("open", { required: true })

// Build scoreDistribution group value from caMaxScores[] + examMax
function toFormShape(s: ScoreConfig) {
  const scoreDistribution: Record<string, number> = { exam: s.examMax }
  s.caMaxScores.forEach((val, i) => {
    scoreDistribution[`ca_${i}`] = val
  })

  return { caCount: s.caCount, scoreDistribution }
}

const formData = ref(toFormShape(scoreConfig.value))

const updateScoreConfig = useUpdateResultScoreConfig()
async function onSubmit(payload: any) {
  const { caCount, scoreDistribution } = payload

  const caMaxScores = Object.entries(scoreDistribution)
    .filter(([key]) => key.startsWith("ca_"))
    .sort(([a], [b]) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    .map(([_, val]) => Number(val))
  const examMax = Number(scoreDistribution.exam)

  useSonner.promise(
    updateScoreConfig.mutateAsync({
      id: props.resultId,
      scoreConfig: { caCount, caMaxScores, examMax }
    }),
    {
      loading: "Updating score config, please wait....",
      success: () => {
        emit("submit")
        return "Score config updated successfully"
      },
      error: (e: any) => e.message
    }
  )
}
</script>

<template>
  <UiSheet v-model:open="isSheetOpen">
    <UiSheetContent
      side="right"
      title="Edit Score Config"
      class="w-full sm:max-w-none md:w-100"
      description="Update the score config, this will recalculate all scores for this result"
    >
      <template #content>
        <FormKit
          :value="formData"
          id="score-config-form"
          type="form"
          :actions="false"
          @submit="onSubmit"
        >
          <fieldset :disabled="updateScoreConfig.isPending.value" class="p-4 pt-0">
            <FormKitMessages class="mb-4" />

            <FormKit type="hidden" name="caCount" />

            <div class="space-y-4">
              <!-- Distribution Inputs -->
              <div class="md:max-w-lg space-y-4">
                <SettingsScoreDistributionInput :ca-count="formData.caCount" />
              </div>
            </div>
          </fieldset>
        </FormKit>
      </template>

      <template #footer>
        <UiSheetFooter>
          <div class="w-full flex gap-1">
            <UiSheetClose as-child>
              <UiButton
                class="flex-1"
                variant="outline"
                type="button"
                :disabled="updateScoreConfig.isPending.value"
              >
                Cancel
              </UiButton>
            </UiSheetClose>

            <UiButton
              class="flex-1"
              type="submit"
              form="score-config-form"
              :disabled="updateScoreConfig.isPending.value"
              :loading="updateScoreConfig.isPending.value"
            >
              {{ updateScoreConfig.isPending.value ? "Submitting..." : "Submit" }}
            </UiButton>
          </div>
        </UiSheetFooter>
      </template>
    </UiSheetContent>
  </UiSheet>
</template>
