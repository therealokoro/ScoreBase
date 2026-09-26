import { kv } from "@nuxthub/kv"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_RESULT_SETTINGS } from "#shared/constants/kv-settings"

import {
  getResultScoreConfig,
  getResultSettings,
  setResultSettings
} from "./result-settings"

vi.mock("@nuxthub/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}))

describe("getResultSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the defaults when KV has nothing stored", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getResultSettings()).resolves.toEqual(DEFAULT_RESULT_SETTINGS)
    expect(kv.get).toHaveBeenCalledWith("settings:result")
  })

  it("deep-merges the stored value over the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue({ positionDisplayMode: "top", positionTopN: 5 })

    const settings = await getResultSettings()

    expect(settings.positionDisplayMode).toBe("top")
    expect(settings.positionTopN).toBe(5)
    // Untouched fields come from the defaults.
    expect(settings.caCount).toBe(DEFAULT_RESULT_SETTINGS.caCount)
    expect(settings.gradeBoundaries).toEqual(DEFAULT_RESULT_SETTINGS.gradeBoundaries)
  })

  it("returns a single field when called with a key", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getResultSettings("caCount")).resolves.toBe(3)
    await expect(getResultSettings("examMax")).resolves.toBe(70)
  })

  it("falls back to the defaults when the merged value is corrupt", async () => {
    // `99` exceeds the maximum caCount, so the whole read must fall back rather
    // than propagating bad data out of KV (audit #27).
    vi.mocked(kv.get).mockResolvedValue({ caCount: 99 })

    await expect(getResultSettings()).resolves.toEqual(DEFAULT_RESULT_SETTINGS)
  })

  it("falls back to the defaults when a cross-field invariant is violated", async () => {
    // Four CA scores but caCount stays at the default of 3.
    vi.mocked(kv.get).mockResolvedValue({ caMaxScores: [10, 10, 10, 10] })

    await expect(getResultSettings()).resolves.toEqual(DEFAULT_RESULT_SETTINGS)
  })
})

describe("setResultSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the merged settings back to KV", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    const result = await setResultSettings({ positionTopN: 5 })

    expect(result.positionTopN).toBe(5)
    expect(result.caCount).toBe(DEFAULT_RESULT_SETTINGS.caCount)
    expect(kv.set).toHaveBeenCalledWith(
      "settings:result",
      expect.objectContaining({ positionTopN: 5 })
    )
  })

  it("deep-merges the partial over the current stored value", async () => {
    vi.mocked(kv.get).mockResolvedValue({ positionDisplayMode: "top", positionTopN: 5 })

    const result = await setResultSettings({ positionDisplayMode: "none" })

    expect(result).toMatchObject({ positionDisplayMode: "none", positionTopN: 5 })
  })

  it("replaces arrays wholesale instead of concatenating them", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)
    const singleBoundary = [{ label: "A", min: 0, max: 100, remark: "Excellent" }]

    const result = await setResultSettings({ gradeBoundaries: singleBoundary })

    expect(result.gradeBoundaries).toEqual(singleBoundary)
  })
})

describe("getResultScoreConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns only the score-config snapshot fields", async () => {
    vi.mocked(kv.get).mockResolvedValue({ caCount: 2, caMaxScores: [20, 20], examMax: 60 })

    const config = await getResultScoreConfig()

    expect(config).toEqual({ caCount: 2, caMaxScores: [20, 20], examMax: 60 })
    expect(Object.keys(config).sort()).toEqual(["caCount", "caMaxScores", "examMax"])
  })

  it("returns the default score config when KV is empty", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getResultScoreConfig()).resolves.toEqual({
      caCount: DEFAULT_RESULT_SETTINGS.caCount,
      caMaxScores: DEFAULT_RESULT_SETTINGS.caMaxScores,
      examMax: DEFAULT_RESULT_SETTINGS.examMax
    })
  })
})
