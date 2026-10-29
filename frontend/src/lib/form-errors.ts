import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ApiError } from "@/lib/api/client"

/**
 * Push server-side validation details onto form fields.
 * Returns true if at least one field error was applied (so the caller can skip a generic toast).
 */
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
  aliases: Record<string, string> = {},
) {
  if (!(err instanceof ApiError) || !err.details) return false
  let applied = false
  for (const [key, message] of Object.entries(err.details)) {
    const field = aliases[key] ?? key
    if (fields.includes(field)) {
      setError(field as Path<T>, { type: "server", message })
      applied = true
    }
  }
  return applied
}
