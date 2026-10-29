import { API_URL } from "@/lib/constants"
import type { ApiErrorBody } from "@/lib/types"

const TOKEN_KEY = "support-desk.token"

export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, string>

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null
    try {
      return window.localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* storage unavailable — session will be in-memory only */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  onUnauthorized = fn
}

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>

export function buildQuery(params: Query = {}) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(","))
    } else {
      sp.set(key, String(value))
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  query?: Query
  signal?: AbortSignal
  auth?: boolean
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, auth = true } = opts
  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const token = auth ? tokenStore.get() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check that the API is running and try again.")
  }

  if (res.status === 204) return undefined as T

  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const e = (payload as ApiErrorBody | null)?.error
    const err = new ApiError(
      res.status,
      e?.code ?? "HTTP_ERROR",
      e?.message ?? `Request failed (${res.status})`,
      e?.details,
    )
    if (res.status === 401 && auth && err.code !== "INVALID_CREDENTIALS") {
      tokenStore.clear()
      onUnauthorized?.()
    }
    throw err
  }

  return payload as T
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
