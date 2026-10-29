"use client"

import {
  AlarmClockIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleDotIcon,
  HourglassIcon,
  InboxIcon,
  LoaderIcon,
  PartyPopperIcon,
  PlusIcon,
  TimerOffIcon,
  UserXIcon,
} from "lucide-react"
import Link from "next/link"
import type * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { EmptyState, ErrorState } from "@/components/common/states"
import { UserAvatar } from "@/components/common/user-avatar"
import { PageHeader } from "@/components/layout/page-header"
import { PriorityIndicator, StatusBadge } from "@/components/tickets/badges"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDashboardStats, useTickets } from "@/hooks/use-api"
import { STATUS_META } from "@/lib/constants"
import { customerLabel, timeAgo } from "@/lib/format"
import type { DashboardStats, Ticket, TicketListParams, TicketStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACTIVE: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"]
const ACTIVE_CSV = ACTIVE.join(",")

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hint,
  tone = "default",
  loading,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  href: string
  hint?: string
  tone?: "default" | "danger" | "warning" | "success"
  loading?: boolean
}) {
  const hot = (value ?? 0) > 0
  const toneCls = {
    default: "text-muted-foreground",
    danger: hot ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
    warning: hot ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
  }[tone]
  const ring = {
    default: "",
    danger: hot ? "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5" : "",
    warning: hot ? "border-orange-200 bg-orange-50/50 dark:border-orange-500/30 dark:bg-orange-500/5" : "",
    success: "",
  }[tone]
  return (
    <Link href={href} className="group rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
      <Card className={cn("gap-2 py-4 transition-colors group-hover:border-primary/40 group-hover:shadow-md", ring)}>
        <CardHeader className="px-4">
          <CardDescription className="flex items-center justify-between text-xs font-medium tracking-wide uppercase">
            {label}
            <Icon className={cn("size-4", toneCls)} />
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <Skeleton className="h-8 w-14" />
          ) : (
            <div className={cn("text-3xl font-semibold tabular-nums", tone !== "default" && hot && toneCls)}>{value ?? 0}</div>
          )}
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusBreakdown({ stats }: { stats: DashboardStats }) {
  const parts: { key: TicketStatus; value: number }[] = [
    { key: "OPEN", value: stats.open },
    { key: "IN_PROGRESS", value: stats.inProgress },
    { key: "WAITING_ON_CUSTOMER", value: stats.waitingOnCustomer },
    { key: "RESOLVED", value: stats.resolved },
  ]
  const total = Math.max(stats.total, 1)
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Status breakdown</CardTitle>
        <CardDescription>{stats.total} tickets across all statuses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Tickets by status">
          {parts.map((p) =>
            p.value ? (
              <Tooltip key={p.key}>
                <TooltipTrigger asChild>
                  <div className={cn("h-full transition-all", STATUS_META[p.key].dot)} style={{ width: `${(p.value / total) * 100}%` }} />
                </TooltipTrigger>
                <TooltipContent>
                  {STATUS_META[p.key].label}: {p.value}
                </TooltipContent>
              </Tooltip>
            ) : null,
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {parts.map((p) => (
            <Link
              key={p.key}
              href={`/tickets?status=${p.key}`}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-muted"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={cn("size-2 rounded-full", STATUS_META[p.key].dot)} />
                {STATUS_META[p.key].label}
              </span>
              <span className="font-medium tabular-nums">{p.value}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TicketMiniList({
  title,
  description,
  params,
  viewAllHref,
  emptyTitle,
  emptyIcon,
  meta,
}: {
  title: string
  description: string
  params: TicketListParams
  viewAllHref: string
  emptyTitle: string
  emptyIcon: React.ReactNode
  meta: (t: Ticket) => React.ReactNode
}) {
  const q = useTickets(params)
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={viewAllHref}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2">
        {q.isLoading ? (
          <div className="space-y-2 px-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} className="py-6" />
        ) : !q.data?.data.length ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} className="py-8" />
        ) : (
          <ul className="divide-y">
            {q.data.data.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="flex items-center gap-3 rounded-md px-4 py-2.5 hover:bg-muted/60">
                  <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">#{t.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customerLabel(t)} · {meta(t)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <PriorityIndicator priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  {t.assignee ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <UserAvatar name={t.assignee.name} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{t.assignee.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="size-6 rounded-full border border-dashed" title="Unassigned" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardView() {
  const { user } = useAuth()
  const stats = useDashboardStats()
  const s = stats.data
  const loading = stats.isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening in the support queue right now."
        actions={
          <Button asChild>
            <Link href="/tickets/new">
              <PlusIcon /> New ticket
            </Link>
          </Button>
        }
      />

      {stats.isError ? (
        <Card>
          <ErrorState error={stats.error} title="Couldn't load dashboard numbers" onRetry={() => stats.refetch()} className="py-10" />
        </Card>
      ) : (
        <>
          <section aria-label="Ticket totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total tickets" value={s?.total} icon={InboxIcon} href="/tickets" loading={loading} />
            <StatCard
              label="Open"
              value={s?.open}
              icon={CircleDotIcon}
              href="/tickets?status=OPEN"
              hint={s ? `${s.waitingOnCustomer} waiting on customer` : undefined}
              loading={loading}
            />
            <StatCard label="In progress" value={s?.inProgress} icon={LoaderIcon} href="/tickets?status=IN_PROGRESS" loading={loading} />
            <StatCard label="Resolved" value={s?.resolved} icon={CheckCircle2Icon} href="/tickets?status=RESOLVED" tone="success" loading={loading} />
          </section>

          <section aria-label="Needs attention" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Urgent"
              value={s?.urgent}
              icon={CircleAlertIcon}
              href={`/tickets?priority=URGENT&status=${ACTIVE_CSV}`}
              hint="Unresolved urgent tickets"
              tone="danger"
              loading={loading}
            />
            <StatCard
              label="Overdue"
              value={s?.overdue}
              icon={AlarmClockIcon}
              href="/tickets?overdue=1&sort=created&order=asc"
              hint="Open > 24h, not resolved"
              tone="danger"
              loading={loading}
            />
            <StatCard
              label="SLA breached"
              value={s?.slaBreached}
              icon={TimerOffIcon}
              href="/tickets?sla=1&sort=created&order=asc"
              hint={s ? `No reply within ${s.slaHours}h target` : undefined}
              tone="warning"
              loading={loading}
            />
            <StatCard
              label="Unassigned"
              value={s?.unassigned}
              icon={UserXIcon}
              href={`/tickets?assignee=unassigned&status=${ACTIVE_CSV}`}
              hint="Active tickets without an owner"
              tone="warning"
              loading={loading}
            />
          </section>

          {s ? <StatusBreakdown stats={s} /> : loading ? <Skeleton className="h-36 w-full rounded-xl" /> : null}
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <TicketMiniList
          title="Overdue"
          description="Unresolved for more than 24 hours — oldest first"
          params={{ overdue: true, sort: "created", order: "asc", pageSize: 6 }}
          viewAllHref="/tickets?overdue=1&sort=created&order=asc"
          emptyTitle="Nothing overdue. Nice work!"
          emptyIcon={<PartyPopperIcon />}
          meta={(t) => `opened ${timeAgo(t.createdAt)}`}
        />
        <TicketMiniList
          title="Urgent queue"
          description="Urgent tickets that still need attention"
          params={{ priority: ["URGENT"], status: ACTIVE, sort: "created", order: "asc", pageSize: 6 }}
          viewAllHref={`/tickets?priority=URGENT&status=${ACTIVE_CSV}`}
          emptyTitle="No urgent tickets"
          emptyIcon={<HourglassIcon />}
          meta={(t) => `opened ${timeAgo(t.createdAt)}`}
        />
      </div>
    </div>
  )
}
