import { kv } from "@nuxthub/kv"

import { DEFAULT_RESULT_SETTINGS, ResultSettings } from "#shared/constants/kv-settings"
import type { ScoreConfigSnapshot } from "#shared/validators/results"

const RESULT_SETTINGS_KV_KEY = "settings:result"

export async function getResultSettings(): Promise<ResultSettings>
export async function getResultSettings<K extends keyof ResultSettings>(
  key: K
): Promise<ResultSettings[K]>
export async function getResultSettings<K extends keyof ResultSettings>(
  key?: K
): Promise<ResultSettings | ResultSettings[K]> {
  const stored = await kv.get<ResultSettings>(RESULT_SETTINGS_KV_KEY)
  const settings = { ...DEFAULT_RESULT_SETTINGS, ...stored }
  return key ? settings[key] : settings
}

export const setResultSettings = async (settings: Partial<ResultSettings>) => {
  const current = await getResultSettings()
  const newSettings = { ...current, ...settings }
  await kv.set(RESULT_SETTINGS_KV_KEY, newSettings)
  return newSettings
}

export const resetResultSettings = async (): Promise<void> => {
  await kv.del(RESULT_SETTINGS_KV_KEY)
}

/**
 * Reads the current result settings from KV and returns only the fields that form the
 * ScoreConfigSnapshot — the shape frozen onto a Result at creation time. Grading and position
 * settings are excluded; those are read fresh from KV at report card render time and never
 * snapshotted.
 */
export const getResultScoreConfig = async (): Promise<ScoreConfigSnapshot> => {
  const { caCount, caMaxScores, examMax } = await getResultSettings()
  return { caCount, caMaxScores, examMax }
}
