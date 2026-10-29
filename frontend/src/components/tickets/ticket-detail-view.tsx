"use client"

import { ArrowLeftIcon, CheckCircle2Icon, FileQuestionIcon, RotateCcwIcon } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { EmptyState, ErrorState } from "@/components/common/states"
import { ActivityTimeline } from "@/components/tickets/activity-timeline"
import { OverdueBadge, PriorityIndicator, SlaBadge, StatusBadge } from "@/components/tickets/badges"
import { Composer } from "@/components/tickets/composer"
import { ConversationThread } from "@/components/tickets/conversation-thread"
import { DeleteTicketButton } from "@/components/tickets/delete-ticket-button"
import { EditTicketDialog } from "@/components/tickets/edit-ticket-dialog"
import { TicketMeta, TicketProperties } from "@/components/tickets/ticket-properties"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useActivity, useMessages, useTicket, useUpdateTicket } from "@/hooks/use-api"
import { ApiError, errorMessage } from "@/lib/api/client"

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

export function TicketDetailView() {
  const params = useParams<{ id: string }>()
  const id = /^\d+$/.test(params.id ?? "") ? Number(params.id) : NaN
  const { isAdmin } = useAuth()
  const ticketQ = useTicket(id)
  const messagesQ = useMessages(id)
  const activityQ = useActivity(id)
  const update = useUpdateTicket(id)

  const notFound =
    Number.isNaN(id) || (ticketQ.error instanceof ApiError && (ticketQ.error.status === 404 || ticketQ.error.status === 400))

  if (notFound) {
    return (
      <EmptyState
        className="py-24"
        icon={<FileQuestionIcon />}
        title="Ticket not found"
        description="It may have been deleted, or the link is wrong."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/tickets">Back to tickets</Link>
          </Button>
        }
      />
    )
  }
  if (ticketQ.isLoading) return <DetailSkeleton />
  if (ticketQ.isError || !ticketQ.data) {
    return <ErrorState className="py-24" error={ticketQ.error} title="Couldn't load this ticket" onRetry={() => ticketQ.refetch()} />
  }

  const t = ticketQ.data
  const resolved = t.status === "RESOLVED"

  async function toggleResolved() {
    try {
      await update.mutateAsync({ status: resolved ? "OPEN" : "RESOLVED" })
      toast.success(resolved ? "Ticket reopened" : "Ticket resolved")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the ticket"))
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/tickets">
          <ArrowLeftIcon /> Tickets
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
            #{t.id}
            {ticketQ.isFetching ? <Spinner className="size-3" /> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{t.subject}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={t.status} />
            <PriorityIndicator priority={t.priority} />
            {t.isOverdue ? <OverdueBadge createdAt={t.createdAt} /> : null}
            {t.slaBreached ? <SlaBadge slaDueAt={t.slaDueAt} /> : null}
            {t.assignee ? null : <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditTicketDialog ticket={t} />
          {isAdmin ? <DeleteTicketButton ticket={t} /> : null}
          <Button
            size="sm"
            variant={resolved ? "outline" : "default"}
            onClick={toggleResolved}
            disabled={update.isPending}
            className={resolved ? undefined : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"}
          >
            {update.isPending ? <Spinner /> : resolved ? <RotateCcwIcon /> : <CheckCircle2Icon />}
            {resolved ? "Reopen" : "Mark resolved"}
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Conversation{" "}
              <span className="font-normal text-muted-foreground">
                · {messagesQ.data?.length ?? t.messageCount} {(messagesQ.data?.length ?? t.messageCount) === 1 ? "entry" : "entries"}
              </span>
            </h2>
          </div>
          {messagesQ.isError ? (
            <ErrorState error={messagesQ.error} title="Couldn't load replies" onRetry={() => messagesQ.refetch()} />
          ) : (
            <ConversationThread ticket={t} messages={messagesQ.data} loading={messagesQ.isLoading} />
          )}
          <Composer ticket={t} />
        </div>

        <aside className="space-y-4">
          <TicketProperties ticket={t} />
          <TicketMeta ticket={t} />
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[28rem] overflow-y-auto">
              {activityQ.isError ? (
                <p className="text-sm text-destructive">
                  {errorMessage(activityQ.error)}{" "}
                  <button className="underline" onClick={() => activityQ.refetch()}>Retry</button>
                </p>
              ) : (
                <ActivityTimeline items={activityQ.data} loading={activityQ.isLoading} />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
