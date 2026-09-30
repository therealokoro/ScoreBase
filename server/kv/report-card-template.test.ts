import { blob } from "@nuxthub/blob"
import { kv } from "@nuxthub/kv"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createDefaultReportCardTemplate,
  type ReportCardTemplate
} from "#shared/constants/report-card"

import {
  getReportCardTemplate,
  resetReportCardTemplate,
  setReportCardTemplate,
  uploadReportCardAsset
} from "./report-card-template"

vi.mock("@nuxthub/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}))

vi.mock("@nuxthub/blob", () => ({
  blob: { put: vi.fn() }
}))

/** Deep clone without any `id` keys, so per-call typeid values never break equality. */
function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "id")
        .map(([key, val]) => [key, stripIds(val)])
    )
  }
  return value
}

describe("getReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the defaults when KV has nothing stored", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    const template = await getReportCardTemplate()

    // IDs differ per call, so compare with all ids stripped.
    expect(stripIds(template)).toEqual(stripIds(createDefaultReportCardTemplate()))
    expect(kv.get).toHaveBeenCalledWith("settings:report-card-template")
  })

  it("deep-merges the stored value over the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue({ name: "Springfield Template" })

    const template = await getReportCardTemplate()

    expect(template.name).toBe("Springfield Template")
    // Sibling fields survive the merge.
    expect(template.layout).toBe("full")
    expect(template.footer[1]?.type).toBe("remarks")
  })

  it("replaces slot arrays wholesale instead of concatenating them", async () => {
    vi.mocked(kv.get).mockResolvedValue({
      main: [scoresBlock()]
    })

    const template = await getReportCardTemplate()

    expect(template.main).toHaveLength(1)
    expect(template.main[0]?.type).toBe("scores")
  })

  it("falls back to the defaults when the merged value is corrupt", async () => {
    // A sidebar block is not allowed while layout is "full", so this fails validation.
    vi.mocked(kv.get).mockResolvedValue({
      sidebar: [
        {
          id: "block_abcdefghjkmnpqrstvwxyz0001",
          type: "grading-key",
          hidden: false,
          config: { title: styled("") }
        }
      ]
    })

    const template = await getReportCardTemplate()

    expect(stripIds(template)).toEqual(stripIds(createDefaultReportCardTemplate()))
  })
})

function scoresBlock() {
  return {
    id: "block_abcdefghjkmnpqrstvwxyz0000",
    type: "scores",
    hidden: false,
    config: {
      caMode: "summed",
      columns: ["subject", "caTotal", "exam", "total", "grade", "remark"]
    }
  }
}

function styled(value: string) {
  return { value, style: { fontSize: 14, fontWeight: "normal", color: "#000000", align: "left" } }
}

describe("setReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the full template back to KV and returns it", async () => {
    const template: ReportCardTemplate = structuredClone(createDefaultReportCardTemplate())
    template.name = "Updated"

    await expect(setReportCardTemplate(template)).resolves.toBe(template)
    expect(kv.set).toHaveBeenCalledWith("settings:report-card-template", template)
  })
})

describe("resetReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deletes the key and returns the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    const template = await resetReportCardTemplate()

    expect(stripIds(template)).toEqual(stripIds(createDefaultReportCardTemplate()))
    expect(kv.del).toHaveBeenCalledWith("settings:report-card-template")
  })
})

describe("uploadReportCardAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uploads under a deterministic key and returns the pathname", async () => {
    vi.mocked(blob.put).mockResolvedValue({ pathname: "report-card/logo-primary" } as never)
    const file = new File(["x"], "logo.png", { type: "image/png" })

    await expect(uploadReportCardAsset(file, "logo-primary")).resolves.toBe(
      "report-card/logo-primary"
    )
    expect(blob.put).toHaveBeenCalledWith("report-card/logo-primary", file, {
      contentType: "image/png",
      addRandomSuffix: false
    })
  })
})
