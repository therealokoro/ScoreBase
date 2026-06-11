<script lang="ts" setup>
import { getNode, type FormKitNode } from "@formkit/core"

const scoreDistributionNode = ref()
const SCORE_TOTAL = 100
const numberOfCAs = defineModel<number>("ca-count", { required: true })

const caItems = computed(() => {
  const ordinals = ["1st", "2nd", "3rd"]
  return ordinals.slice(0, numberOfCAs.value)
})

function totalHundredRule(node: FormKitNode) {
  const values = node.value as Record<string, number>
  if (!values) return true
  const total = Object.values(values).reduce((sum, val) => {
    return sum + (Number(val) || 0)
  }, 0)
  return total === SCORE_TOTAL
}

function totalHundredMessage({ node }: { node: FormKitNode }) {
  const values = node.value as Record<string, number>
  const total = Object.values(values).reduce((sum, val) => {
    return sum + (Number(val) || 0)
  }, 0)
  if (total === 0) return "Score distribution is required"
  if (total > SCORE_TOTAL) return "Total exceeds " + SCORE_TOTAL + " — currently " + total
  return "Total must equal " + SCORE_TOTAL + " — currently " + total
}

watch(numberOfCAs, () => {
  const node = getNode("scoreDistribution")
  if (!node) return
  const validKeys = [...caItems.value.map((i) => i.toLowerCase()), "exam"]
  const current = node.value as Record<string, number>
  for (const key of Object.keys(current)) {
    if (!validKeys.includes(key)) {
      // Remove stale key by setting it to undefined
      const child = node.at(key)
      if (child) child.input(undefined)
    }
  }
})
</script>

<template>
  <FormKit
    type="number"
    name="numberOfCAs"
    label="Number of CAs"
    v-model="numberOfCAs"
    :classes="{ input: 'text-xs' }"
    placeholder="e.g 3"
    help="Specify the total number of CAs student take"
    validation="required|min:1|max:3"
    validation-visibility="live"
    :validation-messages="{
      required: 'Required',
      min: 'You can have a minimum of 1 CA',
      max: 'You can have a maximum of 3 CA'
    }"
  />

  <FormKit
    type="group"
    name="scoreDistribution"
    :validation-rules="{ totalHundred: totalHundredRule }"
    :validation-messages="{ totalHundred: totalHundredMessage }"
    validation="totalHundred"
    validation-visibility="live"
  >
    <div class="space-y-2">
      <UiFieldLabel>Score Distribution</UiFieldLabel>
      <div class="grid grid-cols-4 gap-2">
        <FormKit
          v-for="item in [...caItems, 'Exam']"
          type="number"
          :name="item.toLowerCase()"
          :label="item === 'Exam' ? item : `${item} CA`"
          :classes="{
            outer: 'mb-0',
            label: 'text-xs text-muted-foreground',
            input: 'text-xs'
          }"
          placeholder="Enter score"
          validation="required|min:1"
          :validation-messages="{
            required: 'Required',
            min: 'Min of 1'
          }"
        />
      </div>

      <!-- Group-level total error -->
      <FormKitMessages :node="scoreDistributionNode" />

      <UiFieldDescription>
        Input your preferred score distribution for CAs and Exams. Must total {{ SCORE_TOTAL }}.
      </UiFieldDescription>
    </div>
  </FormKit>
</template>
