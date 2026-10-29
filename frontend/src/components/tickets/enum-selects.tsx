"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import { TICKET_PRIORITIES, TICKET_STATUSES, type TicketPriority, type TicketStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StatusSelect({
  value,
  onChange,
  disabled,
  id,
  className,
}: {
  value: TicketStatus
  onChange: (v: TicketStatus) => void
  disabled?: boolean
  id?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TicketStatus)} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TICKET_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PrioritySelect({
  value,
  onChange,
  disabled,
  id,
  className,
}: {
  value: TicketPriority
  onChange: (v: TicketPriority) => void
  disabled?: boolean
  id?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TicketPriority)} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[...TICKET_PRIORITIES].reverse().map((p) => (
          <SelectItem key={p} value={p}>
            <span className={cn("size-2 rounded-sm", PRIORITY_META[p].barColor)} />
            <span className={PRIORITY_META[p].text}>{PRIORITY_META[p].label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
