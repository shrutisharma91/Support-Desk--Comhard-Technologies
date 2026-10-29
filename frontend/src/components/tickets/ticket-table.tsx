"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { UserAvatar } from "@/components/common/user-avatar"
import { OverdueBadge, PriorityIndicator, SlaBadge, StatusBadge } from "@/components/tickets/badges"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dateTime, timeAgo } from "@/lib/format"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TicketTable({ tickets, dimmed }: { tickets: Ticket[]; dimmed?: boolean }) {
  const router = useRouter()
  return (
    <Table className={cn("transition-opacity", dimmed && "opacity-60")}>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="w-16 pl-4">ID</TableHead>
          <TableHead className="min-w-64">Subject</TableHead>
          <TableHead className="min-w-40">Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="min-w-36">Assignee</TableHead>
          <TableHead className="pr-4 text-right">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => (
          <TableRow
            key={t.id}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a,button")) return
              router.push(`/tickets/${t.id}`)
            }}
            className={cn(
              "cursor-pointer",
              t.isOverdue && "bg-red-50/40 shadow-[inset_3px_0_0_var(--color-red-500)] dark:bg-red-500/5",
              t.status === "RESOLVED" && "text-muted-foreground",
            )}
          >
            <TableCell className="pl-4 font-mono text-xs text-muted-foreground">#{t.id}</TableCell>
            <TableCell className="max-w-md">
              <div className="flex flex-col gap-1">
                <Link href={`/tickets/${t.id}`} className="truncate font-medium text-foreground hover:underline">
                  {t.subject}
                </Link>
                {t.isOverdue || t.slaBreached ? (
                  <div className="flex flex-wrap gap-1">
                    {t.isOverdue ? <OverdueBadge createdAt={t.createdAt} /> : null}
                    {t.slaBreached ? <SlaBadge slaDueAt={t.slaDueAt} /> : null}
                  </div>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="max-w-56">
              <div className="truncate text-sm">{t.customerName ?? t.customerEmail}</div>
              {t.customerName && t.customerEmail ? (
                <div className="truncate text-xs text-muted-foreground">{t.customerEmail}</div>
              ) : null}
            </TableCell>
            <TableCell>
              <StatusBadge status={t.status} />
            </TableCell>
            <TableCell>
              <PriorityIndicator priority={t.priority} />
            </TableCell>
            <TableCell>
              {t.assignee ? (
                <span className="flex items-center gap-2 text-sm">
                  <UserAvatar name={t.assignee.name} />
                  <span className="truncate">{t.assignee.name}</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="pr-4 text-right text-sm whitespace-nowrap text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{timeAgo(t.updatedAt)}</span>
                </TooltipTrigger>
                <TooltipContent>{dateTime(t.updatedAt)}</TooltipContent>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function TicketTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading tickets">
      <div className="h-10 bg-muted/40" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
