import { AlarmClockIcon, CircleAlertIcon, TimerOffIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import { dateTime, timeAgo } from "@/lib/format"
import type { TicketPriority, TicketStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", meta.badge, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  )
}

/** Signal-strength bars + label: readable at a glance and without relying on colour alone. */
export function PriorityIndicator({ priority, className }: { priority: TicketPriority; className?: string }) {
  const meta = PRIORITY_META[priority]
  if (priority === "URGENT") {
    return (
      <Badge className={cn("gap-1 font-semibold", meta.badge, className)}>
        <CircleAlertIcon className="size-3" aria-hidden />
        Urgent
      </Badge>
    )
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text, className)}>
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("w-[3px] rounded-sm", i <= meta.bars ? meta.barColor : "bg-muted-foreground/20")}
            style={{ height: `${i * 25}%` }}
          />
        ))}
      </span>
      {meta.label}
    </span>
  )
}

export function OverdueBadge({ createdAt, className }: { createdAt: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300",
            className,
          )}
        >
          <AlarmClockIcon className="size-3" aria-hidden />
          Overdue
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Unresolved for more than 24h · opened {timeAgo(createdAt)}</TooltipContent>
    </Tooltip>
  )
}

export function SlaBadge({ slaDueAt, className }: { slaDueAt: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300",
            className,
          )}
        >
          <TimerOffIcon className="size-3" aria-hidden />
          SLA breached
        </Badge>
      </TooltipTrigger>
      <TooltipContent>No public reply yet · first response was due {dateTime(slaDueAt)}</TooltipContent>
    </Tooltip>
  )
}
