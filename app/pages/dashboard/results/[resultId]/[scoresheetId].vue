<script lang="ts" setup>
import { ICONS } from "~~/shared/constants/icons"

const route = useRoute()
const resultId = route.params.resultId as string
const scoresheetId = route.params.scoresheetId as string

const {
  data: scoresheet,
  isPending,
  error,
  refetch: refetchScoresheet
} = useGetScoresheet(scoresheetId)

// get the scoresheet, result, student aand scoreConfig
const result = computed(() => scoresheet.value?.result)
const student = computed(() => scoresheet.value?.student)
const scoreConfig = computed(() => result.value?.scoreConfig)
const isLocked = computed(() => result.value?.status === "published")
const pageTitle = computed(() => {
  return student.value ? `${student.value.name}'s Scoresheet` : "Loading..."
})

setPageBreadcrumbLabel(computed(() => student.value?.name))
setPageBreadcrumbLabels({
  [route.params.resultId as string]: computed(() => result.value?.name),
  [route.params.sheetId as string]: computed(() => pageTitle.value)
})

// create a snapshot of the scoresheet to work with locally, this is what will be submitted
const {
  rows,
  createLocalScoresheet,
  isOverMax,
  overallTotal,
  overallMax,
  getRowGrade,
  getRowTotal,
  isDirty
} = useScoresheetHelpers()
watch(
  scoresheet,
  (val) => {
    createLocalScoresheet(val)
  },
  { immediate: true }
)

// get result settings and boundaries
const { data: resultSettings } = useGetResultSettings()
const gradeBoundaries = computed(() => resultSettings.value?.gradeBoundaries ?? [])

// Add / remove subject
// ---------------------------------------------------------------------------
// get subjects as select options
const { data: subjects } = useListSubjects()
const subjectOptions = computed(() =>
  (subjects.value ?? [])
    .filter((s) => !rows.value.some((r) => r.subjectId === s.id))
    .map((s) => ({ value: s.id, label: s.name }))
)

const selectedSubjectToAdd = ref<string | null>(null)
const addSubjectScore = useAddSubjectScore()
function handleAddSubject() {
  if (!selectedSubjectToAdd.value) return
  const subject = subjects.value?.find((s) => s.id === selectedSubjectToAdd.value)
  if (!subject) return

  useSonner.promise(addSubjectScore.mutateAsync({ scoresheetId, subjectId: subject.id }), {
    loading: "Adding subject...",
    success: () => {
      refetchScoresheet()
      selectedSubjectToAdd.value = null
      return `${subject.name} added to scoresheet`
    },
    error: (e: any) => e.message
  })
}

const removeSubjectScore = useRemoveSubjectScore()
function handleRemoveSubject(rowId: string) {
  useSonner.promise(removeSubjectScore.mutateAsync({ id: rowId }), {
    loading: "Removing subject...",
    success: () => {
      refetchScoresheet()
      return "Subject removed"
    },
    error: (e: any) => e.message
  })
}

// Remarks — staged the same way as scores, saved together
// ---------------------------------------------------------------------------
const teacherRemark = ref("")
watch(
  scoresheet,
  (val) => {
    if (val) teacherRemark.value = val.teacherRemark ?? ""
  },
  { immediate: true }
)

const remarkIsDirty = computed(
  () => teacherRemark.value !== (scoresheet.value?.teacherRemark ?? "")
)

// Save to server
// ---------------------------------------------------------------------------
const bulkUpdateScores = useBulkUpdateSubjectScores()
const updateRemarks = useUpdateScoresheetRemarks()
async function handleSave() {
  const promises: Promise<any>[] = []
  if (isDirty(scoresheet)) {
    promises.push(
      bulkUpdateScores.mutateAsync({
        scoresheetId,
        scores: rows.value.map((r) => ({
          id: r.id,
          caScores: r.caScores.map((c) => (c ? Number(c) : c)),
          exam: r.exam ? Number(r.exam) : r.exam
        }))
      })
    )
  }

  if (remarkIsDirty.value) {
    promises.push(
      updateRemarks.mutateAsync({ id: scoresheetId, teacherRemark: teacherRemark.value })
    )
  }

  if (promises.length === 0) return

  useSonner.promise(Promise.all(promises), {
    loading: "Saving student's scores...",
    success: () => {
      refetchScoresheet()
      return "Scores saved successfully"
    },
    error: (e: any) => e.message
  })
}

const metaData = computed(() => [
  { term: "Result Name", details: result.value?.name },
  { term: "Student Name", details: student.value?.name },
  { term: "Student ID", details: student.value?.studentId }
])
</script>

<template>
  <Page :title="pageTitle" :loading="isPending" :error="error ?? undefined">
    <AppEntitySkeleton v-if="isPending" :count="3" />

    <template v-else-if="scoresheet && result">
      <!-- Display some basic information -->
      <UiDescriptionList class="border rounded-lg px-4">
        <template v-for="item in metaData" :key="item.term">
          <UiDescriptionListTerm>{{ item.term }}</UiDescriptionListTerm>
          <UiDescriptionListDetails>{{ item.details }}</UiDescriptionListDetails>
        </template>
        <template>
          <UiDescriptionListTerm>Status</UiDescriptionListTerm>
          <UiDescriptionListDetails>
            <UiBadge variant="secondary">{{ result?.status }}</UiBadge>
          </UiDescriptionListDetails>
        </template>
      </UiDescriptionList>

      <!-- Add subject -->
      <div v-if="!isLocked" class="flex items-end gap-2 md:max-w-md">
        <FormKit
          type="_select"
          v-model="selectedSubjectToAdd"
          label="Add a subject"
          placeholder="Select a subject"
          :options="subjectOptions"
          :classes="{ outer: 'mb-0 flex-1' }"
        />
        <UiButton
          variant="outline"
          :disabled="!selectedSubjectToAdd"
          :loading="addSubjectScore.isPending.value"
          :icon="ICONS.add"
          text="Add"
          @click="handleAddSubject"
        />
      </div>

      <!-- Table to display subjects for scores -->
      <div class="w-full overflow-x-auto border rounded-lg pb-4">
        <UiTable>
          <!-- Table Header -->
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Subject</UiTableHead>
              <UiTableHead
                v-for="i in scoreConfig?.caCount ?? 0"
                :key="i"
                class="text-center w-20 space-x-2"
              >
                <span>CA {{ i }}</span>
                <UiBadge variant="secondary"> ?/{{ scoreConfig?.caMaxScores[i - 1] }} </UiBadge>
              </UiTableHead>
              <UiTableHead class="text-center w-20 space-x-2">
                <span>Exam</span>
                <UiBadge variant="secondary"> ?/{{ scoreConfig?.examMax }} </UiBadge>
              </UiTableHead>
              <UiTableHead class="text-center w-16">Total</UiTableHead>
              <UiTableHead class="text-center w-16">Grade</UiTableHead>
              <UiTableHead v-if="!isLocked" class="w-10" />
            </UiTableRow>
          </UiTableHeader>

          <!-- Table Body -->
          <UiTableBody>
            <!-- Empty Placeholder when there are no subjects on the scoresheet -->
            <UiTableRow v-if="!rows.length">
              <UiTableCell
                :colspan="(scoreConfig?.caCount ?? 0) + 4"
                class="text-center h-24 text-muted-foreground"
              >
                No subjects on this scoresheet yet.
              </UiTableCell>
            </UiTableRow>

            <!-- Show subjects and score inputs -->
            <UiTableRow v-for="row in rows" :key="row.id">
              <!-- Subject Name -->
              <UiTableCell class="font-medium">{{ row.subjectName }}</UiTableCell>

              <!-- CA Score Inputs -->
              <UiTableCell v-for="(_, i) in row.caScores" :key="i" class="p-1">
                <FormKit
                  type="number"
                  v-model="row.caScores[i]"
                  :disabled="isLocked"
                  min="0"
                  placeholder="e.g 0"
                  :max="scoreConfig?.caMaxScores[i]"
                  :classes="{
                    outer: 'mb-0',
                    messages: 'hidden',
                    input: `text-xs text-center h-9 ${isOverMax(row.caScores[i], scoreConfig?.caMaxScores[i]) ? '' : ''}`
                  }"
                  :validation="`between:0,${scoreConfig?.caMaxScores[i]}`"
                  :validation-messages="{ between: '' }"
                />
              </UiTableCell>

              <!-- Exam Score Input -->
              <UiTableCell class="p-1">
                <FormKit
                  type="number"
                  v-model="row.exam"
                  :disabled="isLocked"
                  min="0"
                  placeholder="e.g 0"
                  :max="scoreConfig?.examMax"
                  :classes="{
                    outer: 'mb-0',
                    messages: 'hidden',
                    input: `text-xs text-center h-9 ${
                      isOverMax(row.exam, scoreConfig?.examMax) ? 'text-destructive' : ''
                    }`
                  }"
                  :validation="`between:0,${scoreConfig?.examMax}`"
                  :validation-messages="{ between: '' }"
                />
              </UiTableCell>

              <!-- Derived Total -->
              <UiTableCell class="text-center font-medium">
                {{ getRowTotal(row) }}
              </UiTableCell>

              <!-- Derived Grade - If there's a grade for the derived score, show grade -->
              <UiTableCell class="text-center">
                <UiBadge v-if="getRowGrade(getRowTotal(row), gradeBoundaries)" variant="outline">
                  {{ getRowGrade(getRowTotal(row), gradeBoundaries)?.label }}
                </UiBadge>
                <span v-else class="text-muted-foreground text-xs">—</span>
              </UiTableCell>

              <UiTableCell v-if="!isLocked">
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  :icon="ICONS.delete"
                  class="text-destructive"
                  @click="handleRemoveSubject(row.id)"
                />
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div>

      <!-- Summary -->
      <UiBadge variant="secondary" size="lg" class="flex items-center gap-3 w-fit mx-auto">
        <span class="font-medium">Total Score Obtained:</span>
        <span>{{ overallTotal }} / {{ overallMax }}</span>
      </UiBadge>

      <!-- Remarks -->
      <FormKit
        type="textarea"
        v-model="teacherRemark"
        label="Teacher's Remark"
        :disabled="isLocked"
        placeholder="Add a remark for this student's performance this term"
        rows="3"
      />

      <!-- Submit Button -->
      <UiButton
        :disabled="!isDirty(scoresheet).value && !remarkIsDirty"
        :loading="bulkUpdateScores.isPending.value || updateRemarks.isPending.value"
        :icon="ICONS.save"
        text="Commit Changes"
        class="h-10 w-full lg:w-md mx-auto"
        @click="handleSave"
      />
    </template>
  </Page>
</template>
