type RawDateTime = number | Date | string

// ─── helpers ──────────────────────────────────────────────────────────────────
function toDate(raw: RawDateTime): Date {
  if (raw instanceof Date) return raw
  // number → treat as ms timestamp (matches integer column mode:"timestamp_ms")
  if (typeof raw === "number") return new Date(raw)
  // string → ISO or numeric string
  const asNum = Number(raw)
  return isNaN(asNum) ? new Date(raw) : new Date(asNum)
}
export function formatDate(raw: RawDateTime, prefix?: string): string {
  const date = toDate(raw)
  if (isNaN(date.getTime())) return "Invalid date"
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return prefix ? `${prefix} ${formatted}` : formatted
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
