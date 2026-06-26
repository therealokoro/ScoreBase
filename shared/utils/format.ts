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

// Small local relative-time formatter
export function timeAgo(isoString: string) {
  const then = new Date(isoString).getTime()
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  return new Date(isoString).toLocaleDateString()
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
