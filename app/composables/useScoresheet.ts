// ---------------------------------------------------------------------------
// Local editable copy — staged changes, nothing hits the server until Save
// ---------------------------------------------------------------------------

import type { ScoresheetWithDetails } from "~~/shared/validators/scoresheet"

type EditableScore = {
  id: string
  subjectId: string | null
  subjectName: string
  caScores: number[]
  exam: number
}

export const useScoresheetHelpers = () => {
  const rows = ref<EditableScore[]>([])

  function createLocalScoresheet(_scoresheet: MaybeRef<ScoresheetWithDetails | undefined>) {
    const scoresheet = toRef(_scoresheet)
    if (!scoresheet.value) return
    rows.value = scoresheet.value.subjectScores.map((s) => ({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject?.name ?? "Unknown subject",
      caScores: s.caScores.map((c) => Number(c)),
      exam: Number(s.exam)
    }))
  }

  // Dirty check — compares the live rows against what the server last returned
  const isDirty = (_scoresheet: MaybeRef<ScoresheetWithDetails | undefined>) =>
    computed(() => {
      const scoresheet = toRef(_scoresheet)
      if (!scoresheet.value) return false
      return (
        JSON.stringify(rows.value) !==
        JSON.stringify(
          scoresheet.value.subjectScores.map((s) => ({
            id: s.id,
            subjectId: s.subjectId,
            subjectName: s.subject?.name ?? "Unknown subject",
            caScores: s.caScores,
            exam: s.exam
          }))
        )
      )
    })

  // ---------------------------------------------------------------------------
  // Live computed metrics per row — total + grade, recalculated as you type
  // ---------------------------------------------------------------------------

  function getCaTotal(caScores: (number | null | string)[]) {
    return caScores.reduce<number>((sum, s) => sum + (Number(s) || 0), 0)
  }

  function getRowTotal(row: EditableScore) {
    const exam = Number(row.exam)
    return getCaTotal(row.caScores) + (exam ?? 0)
  }

  // Per-slot ceiling check — used to flag a field red if it exceeds the max
  function isOverMax(value: number | string | null | undefined, max: number | undefined): boolean {
    if (value === null || value === undefined || value === "") return false
    if (max === undefined) return false
    const num = Number(value)
    return !Number.isNaN(num) && num > max
  }

  const overallTotal = computed(() => rows.value.reduce((sum, r) => sum + getRowTotal(r), 0))
  const overallMax = computed(() => 100 * rows.value.length)

  function getRowGrade(
    total: number,
    gradeBoundaries: MaybeRef<{ label: string; min: number; max: number; remark: string }[]>
  ) {
    return toRef(gradeBoundaries).value.find((b) => total >= b.min && total <= b.max) ?? null
  }

  return {
    rows,
    createLocalScoresheet,
    isDirty,
    isOverMax,
    overallMax,
    overallTotal,
    getRowGrade,
    getRowTotal
  }
}
