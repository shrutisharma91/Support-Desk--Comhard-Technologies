import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns"

function toDate(iso: string | null | undefined) {
  if (!iso) return null
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

export function timeAgo(iso: string | null | undefined) {
  const d = toDate(iso)
  if (!d) return "—"
  if (Math.abs(Date.now() - d.getTime()) < 45_000) return "just now"
  return `${formatDistanceToNowStrict(d)} ago`
}

export function timeUntil(iso: string | null | undefined) {
  const d = toDate(iso)
  if (!d) return "—"
  const past = d.getTime() < Date.now()
  const dist = formatDistanceToNowStrict(d)
  return past ? `${dist} ago` : `in ${dist}`
}

export function dateTime(iso: string | null | undefined) {
  const d = toDate(iso)
  return d ? format(d, "d MMM yyyy, h:mm a") : "—"
}

export function shortDateTime(iso: string | null | undefined) {
  const d = toDate(iso)
  return d ? format(d, "d MMM, h:mm a") : "—"
}

export function initials(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

export function customerLabel(t: { customerName: string | null; customerEmail: string | null }) {
  return t.customerName || t.customerEmail || "Unknown customer"
}

export function ticketRef(id: number) {
  return `#${id}`
}
