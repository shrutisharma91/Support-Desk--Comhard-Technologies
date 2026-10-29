"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type SortOrder,
  type TicketListParams,
  type TicketPriority,
  type TicketSort,
  type TicketStatus,
} from "@/lib/types"

export const PAGE_SIZES = [10, 20, 50] as const

export interface TicketFilters {
  q: string
  status: TicketStatus[]
  priority: TicketPriority[]
  assignee: string // "" | "me" | "unassigned" | "<id>"
  overdue: boolean
  sla: boolean
  sort: TicketSort
  order: SortOrder
  page: number
  pageSize: number
}

function csv<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  return raw.split(",").filter((v): v is T => (allowed as readonly string[]).includes(v))
}

function parse(sp: URLSearchParams): TicketFilters {
  const sort = sp.get("sort")
  const order = sp.get("order")
  const page = Number(sp.get("page"))
  const pageSize = Number(sp.get("pageSize"))
  return {
    q: sp.get("q") ?? "",
    status: csv(sp.get("status"), TICKET_STATUSES),
    priority: csv(sp.get("priority"), TICKET_PRIORITIES),
    assignee: sp.get("assignee") ?? "",
    overdue: sp.get("overdue") === "1",
    sla: sp.get("sla") === "1",
    sort: sort === "priority" || sort === "created" ? sort : "updated",
    order: order === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : 10,
  }
}

function serialize(f: TicketFilters) {
  const sp = new URLSearchParams()
  if (f.q.trim()) sp.set("q", f.q.trim())
  if (f.status.length) sp.set("status", f.status.join(","))
  if (f.priority.length) sp.set("priority", f.priority.join(","))
  if (f.assignee) sp.set("assignee", f.assignee)
  if (f.overdue) sp.set("overdue", "1")
  if (f.sla) sp.set("sla", "1")
  if (f.sort !== "updated") sp.set("sort", f.sort)
  if (f.order !== "desc") sp.set("order", f.order)
  if (f.page > 1) sp.set("page", String(f.page))
  if (f.pageSize !== 10) sp.set("pageSize", String(f.pageSize))
  return sp.toString()
}

export function toApiParams(f: TicketFilters): TicketListParams {
  let assigneeId: TicketListParams["assigneeId"]
  if (f.assignee === "me" || f.assignee === "unassigned") assigneeId = f.assignee
  else if (/^\d+$/.test(f.assignee)) assigneeId = Number(f.assignee)
  return {
    q: f.q || undefined,
    status: f.status.length ? f.status : undefined,
    priority: f.priority.length ? f.priority : undefined,
    assigneeId,
    overdue: f.overdue || undefined,
    slaBreached: f.sla || undefined,
    sort: f.sort,
    order: f.order,
    page: f.page,
    pageSize: f.pageSize,
  }
}

/** Filters live in the URL so views are shareable, bookmarkable and survive refresh. */
export function useTicketFilters() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const key = sp.toString()
  const filters = React.useMemo(() => parse(new URLSearchParams(key)), [key])

  const setFilters = React.useCallback(
    (patch: Partial<TicketFilters>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const next = { ...filters, ...patch }
      if (opts.resetPage && !("page" in patch)) next.page = 1
      const qs = serialize(next)
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [filters, router, pathname],
  )

  const clearFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.status.length ? 1 : 0) +
    (filters.priority.length ? 1 : 0) +
    (filters.assignee ? 1 : 0) +
    (filters.overdue ? 1 : 0) +
    (filters.sla ? 1 : 0)

  return { filters, setFilters, clearFilters, activeCount }
}
