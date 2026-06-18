<script lang="ts" setup>
import { type FormKitNode } from "@formkit/core"

const SCORE_TOTAL = 100

const props = defineProps<{ caCount: number | string }>()

// Coerce to number and clamp between 1–5 before rendering
const safeCount = computed(() => {
  const n = Number(props.caCount)
  if (!n || n < 1 || n > 5) return 0 // 0 = don't render anything
  return Math.floor(n)
})

const caSlots = computed(() => Array.from({ length: safeCount.value }, (_, i) => i))

// Live total
const groupValue = ref<Record<string, number>>({})
const scoreTotal = computed(() =>
  Object.values(groupValue.value).reduce((sum, val) => sum + (Number(val) || 0), 0)
)
const scoreTotalValid = computed(() => scoreTotal.value === SCORE_TOTAL)

// Custom group validation
function totalHundredRule(node: FormKitNode) {
  const values = node.value as Record<string, number>
  if (!values) return true
  const total = Object.values(values).reduce((sum, val) => sum + (Number(val) || 0), 0)
  return total === SCORE_TOTAL
}

function totalHundredMessage({ node }: { node: FormKitNode }) {
  const values = node.value as Record<string, number>
  const total = Object.values(values).reduce((sum, val) => sum + (Number(val) || 0), 0)
  if (total === 0) return "Score distribution is required"
  if (total > SCORE_TOTAL) return `Total exceeds ${SCORE_TOTAL} — currently ${total}`
  return `Total must equal ${SCORE_TOTAL} — currently ${total}`
}

const commonInputAttrs = {
  type: "number",
  classes: {
    outer: "mb-0",
    label: "text-xs text-muted-foreground",
    input: "text-xs"
  },
  placeholder: "Enter score",
  validation: "required|min:1",
  validationMessages: { required: "Required", min: "Min of 1" }
}
</script>

<template>
  <FormKit
    type="group"
    name="scoreDistribution"
    v-model="groupValue"
    :validation-rules="{ totalHundred: totalHundredRule }"
    :validation-messages="{ totalHundred: totalHundredMessage }"
    validation="totalHundred"
    validation-visibility="live"
  >
    <div class="space-y-2">
      <UiFieldLabel>Score Distribution</UiFieldLabel>

      <!-- Only render when caCount is a valid value between 1 and 5 -->
      <template v-if="safeCount > 0">
        <div class="grid grid-cols-4 gap-2">
          <FormKit
            v-for="index in caSlots"
            :key="index"
            :name="`ca_${index}`"
            :label="`CA ${index + 1}`"
            v-bind="commonInputAttrs"
          />
          <FormKit name="exam" label="Exam" v-bind="commonInputAttrs" />
        </div>

        <!-- Live total -->
        <p
          class="text-xs font-medium"
          :class="scoreTotalValid ? 'text-green-600' : 'text-destructive'"
        >
          Total: {{ scoreTotal }} / {{ SCORE_TOTAL }}
          <span v-if="!scoreTotalValid"> — must equal {{ SCORE_TOTAL }}</span>
        </p>
      </template>

      <p v-else class="text-xs text-muted-foreground">
        Enter a valid CA count (1–5) above to configure score distribution.
      </p>

      <UiFieldDescription>
        Input your preferred score distribution for CAs and Exam. Must total {{ SCORE_TOTAL }}.
      </UiFieldDescription>
    </div>
  </FormKit>
</template>
