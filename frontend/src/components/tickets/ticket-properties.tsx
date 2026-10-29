"use client"

import * as React from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { AssigneeSelect } from "@/components/tickets/assignee-select"
import { PrioritySelect, StatusSelect } from "@/components/tickets/enum-selects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useUpdateTicket, useUsers } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import { PRIORITY_META, STATUS_META } from "@/lib/constants"
import { dateTime, timeAgo, timeUntil } from "@/lib/format"
import type { Ticket, UpdateTicketInput } from "@/lib/types"
import { cn } from "@/lib/utils"

type Key = "status" | "priority" | "assigneeId"

export function TicketProperties({ ticket }: { ticket: Ticket }) {
  const update = useUpdateTicket(ticket.id)
  const users = useUsers()
  const { user } = useAuth()
  const [pending, setPending] = React.useState<Key | null>(null)

  async function save(key: Key, input: UpdateTicketInput, success: string) {
    setPending(key)
    try {
      await update.mutateAsync(input)
      toast.success(success)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the ticket"))
    } finally {
      setPending(null)
    }
  }

  const label = (text: string, key: Key) => (
    <span className="flex items-center gap-2">
      {text}
      {pending === key ? <Spinner className="size-3 text-muted-foreground" /> : null}
    </span>
  )

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-sm">Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor="prop-status">{label("Status", "status")}</FieldLabel>
          <StatusSelect
            id="prop-status"
            value={ticket.status}
            disabled={!!pending}
            onChange={(status) =>
              status !== ticket.status && save("status", { status }, `Status set to ${STATUS_META[status].label}`)
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-priority">{label("Priority", "priority")}</FieldLabel>
          <PrioritySelect
            id="prop-priority"
            value={ticket.priority}
            disabled={!!pending}
            onChange={(priority) =>
              priority !== ticket.priority &&
              save("priority", { priority }, `Priority set to ${PRIORITY_META[priority].label}`)
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="prop-assignee">{label("Assignee", "assigneeId")}</FieldLabel>
          <AssigneeSelect
            id="prop-assignee"
            value={ticket.assignee ? String(ticket.assignee.id) : "none"}
            disabled={!!pending}
            currentUserId={user?.id}
            onChange={(v) => {
              const assigneeId = v === "none" ? null : Number(v)
              if (assigneeId === (ticket.assignee?.id ?? null)) return
              const name = users.data?.find((u) => u.id === assigneeId)?.name
              save("assigneeId", { assigneeId }, assigneeId ? `Assigned to ${name ?? "agent"}` : "Ticket unassigned")
            }}
          />
          {user && ticket.assignee?.id !== user.id ? (
            <button
              type="button"
              disabled={!!pending}
              className="w-fit text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
              onClick={() => save("assigneeId", { assigneeId: user.id }, "Assigned to you")}
            >
              Assign to me
            </button>
          ) : null}
        </Field>
      </CardContent>
    </Card>
  )
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 text-right break-words", className)}>{children}</dd>
    </div>
  )
}

export function TicketMeta({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-sm">Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          <Row label="Customer">{ticket.customerName ?? "—"}</Row>
          <Row label="Email">
            {ticket.customerEmail ? (
              <a href={`mailto:${ticket.customerEmail}`} className="text-primary hover:underline">
                {ticket.customerEmail}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Created">
            <span title={dateTime(ticket.createdAt)}>{timeAgo(ticket.createdAt)}</span>
            {ticket.createdBy ? <div className="text-xs text-muted-foreground">by {ticket.createdBy.name}</div> : null}
          </Row>
          <Row label="Last updated">
            <span title={dateTime(ticket.updatedAt)}>{timeAgo(ticket.updatedAt)}</span>
          </Row>
          <Row label="First response" className={cn(ticket.slaBreached && "text-orange-700 dark:text-orange-300")}>
            {ticket.firstResponseAt ? (
              <span title={dateTime(ticket.firstResponseAt)}>{timeAgo(ticket.firstResponseAt)}</span>
            ) : ticket.status === "RESOLVED" ? (
              "—"
            ) : (
              <span title={dateTime(ticket.slaDueAt)}>
                {ticket.slaBreached ? "SLA breached " : "Due "}
                {timeUntil(ticket.slaDueAt)}
              </span>
            )}
          </Row>
          {ticket.resolvedAt ? (
            <Row label="Resolved" className="text-emerald-700 dark:text-emerald-400">
              <span title={dateTime(ticket.resolvedAt)}>{timeAgo(ticket.resolvedAt)}</span>
            </Row>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  )
}
