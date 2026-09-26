import { kv } from "@nuxthub/kv"

import { DEFAULT_RESULT_SETTINGS, type ResultSettings } from "#shared/constants/kv-settings"
import type { ScoreConfigSnapshot } from "#shared/validators/results"
import { ResultSettingsSchema } from "#shared/validators/settings"

import { mergeSettings } from "./merge-settings"

const RESULT_SETTINGS_KV_KEY = "settings:result"

export async function getResultSettings(): Promise<ResultSettings>
export async function getResultSettings<K extends keyof ResultSettings>(
  key: K
): Promise<ResultSettings[K]>
export async function getResultSettings<K extends keyof ResultSettings>(
  key?: K
): Promise<ResultSettings | ResultSettings[K]> {
  const stored = await kv.get<Partial<ResultSettings>>(RESULT_SETTINGS_KV_KEY)
  const merged = mergeSettings(stored ?? {}, DEFAULT_RESULT_SETTINGS) as ResultSettings

  // Guard against corrupted KV values: fall back to defaults rather than propagating bad data.
  const parsed = ResultSettingsSchema.safeParse(merged)
  const settings = (parsed.success ? parsed.data : DEFAULT_RESULT_SETTINGS) as ResultSettings

  return key ? settings[key] : settings
}

export const setResultSettings = async (
  settings: Partial<ResultSettings>,
  /** Pass the already-read current value to avoid a second KV read. */
  current?: ResultSettings
) => {
  const base = current ?? (await getResultSettings())
  // Deep-merge over the current value (arrays replaced wholesale) so nested objects
  // survive partial updates.
  const newSettings = mergeSettings(settings, base) as ResultSettings
  await kv.set(RESULT_SETTINGS_KV_KEY, newSettings)
  return newSettings
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
