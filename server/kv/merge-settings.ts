import { createDefu } from "defu"

/**
 * Deep-merges stored KV settings over their defaults.
 *
 * Plain `defu` concatenates arrays, which would duplicate persisted arrays such as
 * `gradeBoundaries` and `caMaxScores`. This merger replaces arrays wholesale so the stored value
 * always wins, while nested objects are still merged deeply.
 */
export const mergeSettings = createDefu((object, key, value) => {
  if (Array.isArray(value) && Array.isArray(object[key])) {
    object[key] = value
    return true
  }
})
