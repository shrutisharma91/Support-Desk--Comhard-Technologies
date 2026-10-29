"use client"

import {
  AlarmClockIcon,
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  TimerOffIcon,
  XIcon,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUsers } from "@/hooks/use-api"
import type { TicketFilters } from "@/hooks/use-ticket-filters"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import { TICKET_PRIORITIES, TICKET_STATUSES, type TicketSort } from "@/lib/types"
import { cn } from "@/lib/utils"

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (next: T[]) => void
  renderOption: (v: T) => React.ReactNode
}) {
  const count = selected.length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", count && "border-primary/40 bg-primary/5")}>
          {label}
          {count ? (
            <span className="rounded-sm bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{count}</span>
          ) : null}
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Filter by {label.toLowerCase()}</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o}
            checked={selected.includes(o)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(checked ? [...selected, o] : selected.filter((s) => s !== o))
            }
          >
            {renderOption(o)}
          </DropdownMenuCheckboxItem>
        ))}
        {count ? (
          <>
            <DropdownMenuSeparator />
            <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onChange([])}>
              Clear
            </Button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SORT_LABELS: Record<TicketSort, string> = {
  updated: "Last updated",
  priority: "Priority",
  created: "Created",
}

export function TicketFiltersBar({
  filters,
  setFilters,
  clearFilters,
  activeCount,
}: {
  filters: TicketFilters
  setFilters: (patch: Partial<TicketFilters>) => void
  clearFilters: () => void
  activeCount: number
}) {
  const users = useUsers()
  const [search, setSearch] = React.useState(filters.q)
  const [syncedQ, setSyncedQ] = React.useState(filters.q)
  const [pushedQ, setPushedQ] = React.useState(filters.q)

  // URL changed from elsewhere (sidebar view, "clear all", back/forward) → reflect it in the input.
  // Changes we pushed ourselves are skipped so in-flight typing isn't overwritten.
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q)
    if (filters.q !== pushedQ) setSearch(filters.q)
  }

  // Debounce search → URL.
  React.useEffect(() => {
    const next = search.trim()
    if (next === filters.q) return
    const t = setTimeout(() => {
      setPushedQ(next)
      setFilters({ q: next })
    }, 300)
    return () => clearTimeout(t)
  }, [search, filters.q, setFilters])

  const assigneeValue = filters.assignee || "all"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject, customer name or email"
          className="h-9 pl-8"
          aria-label="Search tickets"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <MultiSelect
        label="Status"
        options={TICKET_STATUSES}
        selected={filters.status}
        onChange={(status) => setFilters({ status })}
        renderOption={(s) => (
          <span className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </span>
        )}
      />

      <MultiSelect
        label="Priority"
        options={[...TICKET_PRIORITIES].reverse()}
        selected={filters.priority}
        onChange={(priority) => setFilters({ priority })}
        renderOption={(p) => <span className={PRIORITY_META[p].text}>{PRIORITY_META[p].label}</span>}
      />

      <Select value={assigneeValue} onValueChange={(v) => setFilters({ assignee: v === "all" ? "" : v })}>
        <SelectTrigger className={cn("min-w-36", filters.assignee && "border-primary/40 bg-primary/5")} aria-label="Assignee">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any assignee</SelectItem>
          <SelectItem value="me">Assigned to me</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {users.data?.length ? (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Agents</SelectLabel>
                {users.data.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          ) : null}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        aria-pressed={filters.overdue}
        onClick={() => setFilters({ overdue: !filters.overdue })}
        className={cn(
          "h-9",
          filters.overdue &&
            "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300",
        )}
      >
        {filters.overdue ? <CheckIcon /> : <AlarmClockIcon />}
        Overdue
      </Button>

      <Button
        variant="outline"
        size="sm"
        aria-pressed={filters.sla}
        onClick={() => setFilters({ sla: !filters.sla })}
        className={cn(
          "h-9",
          filters.sla &&
            "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300",
        )}
      >
        {filters.sla ? <CheckIcon /> : <TimerOffIcon />}
        SLA breached
      </Button>

      {activeCount ? (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
          <XIcon /> Clear all
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v as TicketSort })}>
          <SelectTrigger className="min-w-40" aria-label="Sort by">
            <span className="text-muted-foreground">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {(Object.keys(SORT_LABELS) as TicketSort[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => setFilters({ order: filters.order === "desc" ? "asc" : "desc" })}
              aria-label={filters.order === "desc" ? "Sorted descending" : "Sorted ascending"}
            >
              {filters.order === "desc" ? <ArrowDownWideNarrowIcon /> : <ArrowUpNarrowWideIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {filters.sort === "priority"
              ? filters.order === "desc" ? "Highest priority first" : "Lowest priority first"
              : filters.order === "desc" ? "Newest first" : "Oldest first"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
