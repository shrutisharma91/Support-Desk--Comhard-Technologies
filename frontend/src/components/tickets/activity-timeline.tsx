"use client"

import {
  ArrowRightIcon,
  CirclePlusIcon,
  FlagIcon,
  GlobeIcon,
  HistoryIcon,
  LockIcon,
  PencilIcon,
  RefreshCwIcon,
  UserRoundCogIcon,
} from "lucide-react"
import type * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import { dateTime, timeAgo } from "@/lib/format"
import type { Activity, TicketPriority, TicketStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const ICONS: Record<Activity["type"], { icon: React.ElementType; color: string }> = {
  TICKET_CREATED: { icon: CirclePlusIcon, color: "text-emerald-600 dark:text-emerald-400" },
  STATUS_CHANGED: { icon: RefreshCwIcon, color: "text-blue-600 dark:text-blue-400" },
  PRIORITY_CHANGED: { icon: FlagIcon, color: "text-orange-600 dark:text-orange-400" },
  ASSIGNEE_CHANGED: { icon: UserRoundCogIcon, color: "text-violet-600 dark:text-violet-400" },
  DETAILS_UPDATED: { icon: PencilIcon, color: "text-slate-600 dark:text-slate-400" },
  REPLY_ADDED: { icon: GlobeIcon, color: "text-blue-600 dark:text-blue-400" },
  NOTE_ADDED: { icon: LockIcon, color: "text-amber-600 dark:text-amber-400" },
}

function Val({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>
}

function statusLabel(v: string | null) {
  return v && v in STATUS_META ? STATUS_META[v as TicketStatus].label : (v ?? "—")
}
function priorityLabel(v: string | null) {
  return v && v in PRIORITY_META ? PRIORITY_META[v as TicketPriority].label : (v ?? "—")
}

function Change({ from, to }: { from: React.ReactNode; to: React.ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-muted-foreground line-through decoration-muted-foreground/50">{from}</span>
      <ArrowRightIcon className="size-3 text-muted-foreground" />
      <Val>{to}</Val>
    </span>
  )
}

function describe(a: Activity): React.ReactNode {
  switch (a.type) {
    case "TICKET_CREATED":
      return "created the ticket"
    case "STATUS_CHANGED":
      return <>changed status <Change from={statusLabel(a.fromValue)} to={statusLabel(a.toValue)} /></>
    case "PRIORITY_CHANGED":
      return <>changed priority <Change from={priorityLabel(a.fromValue)} to={priorityLabel(a.toValue)} /></>
    case "ASSIGNEE_CHANGED":
      if (!a.fromValue && a.toValue) return <>assigned to <Val>{a.toValue}</Val></>
      if (a.fromValue && !a.toValue) return <>unassigned <Val>{a.fromValue}</Val></>
      return <>reassigned <Change from={a.fromValue ?? "Unassigned"} to={a.toValue ?? "Unassigned"} /></>
    case "DETAILS_UPDATED":
      return <>edited <Val>{a.toValue ?? "details"}</Val></>
    case "REPLY_ADDED":
      return "sent a public reply"
    case "NOTE_ADDED":
      return "added an internal note"
    default:
      return String(a.type).toLowerCase().replaceAll("_", " ")
  }
}

export function ActivityTimeline({ items, loading }: { items: Activity[] | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (!items?.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <HistoryIcon className="size-4" /> No activity recorded yet.
      </p>
    )
  }
  return (
    <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-border">
      {items.map((a) => {
        const { icon: Icon, color } = ICONS[a.type] ?? ICONS.DETAILS_UPDATED
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className={cn("size-3.5", color)} />
            </span>
            <div className="min-w-0 pt-0.5 text-sm leading-snug">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{a.actor?.name ?? "Someone"}</span> {describe(a)}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <time dateTime={a.createdAt} className="text-xs text-muted-foreground/80">
                    {timeAgo(a.createdAt)}
                  </time>
                </TooltipTrigger>
                <TooltipContent>{dateTime(a.createdAt)}</TooltipContent>
              </Tooltip>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
