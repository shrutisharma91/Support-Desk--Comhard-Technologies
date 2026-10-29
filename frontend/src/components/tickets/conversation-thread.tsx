"use client"

import { GlobeIcon, LockIcon, MailIcon, MessagesSquareIcon } from "lucide-react"

import { UserAvatar } from "@/components/common/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { dateTime, shortDateTime } from "@/lib/format"
import type { Message, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

function Timestamp({ iso }: { iso: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} className="text-xs text-muted-foreground">
          {shortDateTime(iso)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{dateTime(iso)}</TooltipContent>
    </Tooltip>
  )
}

function OriginalRequest({ ticket }: { ticket: Ticket }) {
  const who = ticket.customerName ?? ticket.customerEmail ?? "Customer"
  return (
    <li className="relative flex gap-3">
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
        <MailIcon className="size-4 text-muted-foreground" />
      </div>
      <article className="min-w-0 flex-1 rounded-lg border bg-card shadow-xs">
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2.5">
          <span className="text-sm font-medium">{who}</span>
          {ticket.customerName && ticket.customerEmail ? (
            <span className="text-xs text-muted-foreground">&lt;{ticket.customerEmail}&gt;</span>
          ) : null}
          <span className="text-xs text-muted-foreground">· original request</span>
          <span className="ml-auto">
            <Timestamp iso={ticket.createdAt} />
          </span>
        </header>
        <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
      </article>
    </li>
  )
}

function MessageItem({ message }: { message: Message }) {
  const isNote = message.type === "NOTE"
  return (
    <li className="relative flex gap-3">
      <UserAvatar name={message.author?.name} className="relative z-10 size-8 text-xs ring-4 ring-background" />
      <article
        className={cn(
          "min-w-0 flex-1 rounded-lg border shadow-xs",
          isNote
            ? "border-dashed border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10"
            : "bg-card",
        )}
        aria-label={isNote ? "Internal note" : "Public reply"}
      >
        <header
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2.5",
            isNote && "border-dashed border-amber-300 dark:border-amber-500/40",
          )}
        >
          <span className="text-sm font-medium">{message.author?.name ?? "Deleted user"}</span>
          {isNote ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-500/25 dark:text-amber-200">
              <LockIcon className="size-3" /> Internal note
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">
              <GlobeIcon className="size-3" /> Public reply
            </span>
          )}
          <span className="ml-auto">
            <Timestamp iso={message.createdAt} />
          </span>
        </header>
        <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">{message.body}</div>
      </article>
    </li>
  )
}

export function ConversationThread({
  ticket,
  messages,
  loading,
}: {
  ticket: Ticket
  messages: Message[] | undefined
  loading: boolean
}) {
  return (
    <section aria-label="Conversation" className="space-y-3">
      <ol className="relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-border">
        <OriginalRequest ticket={ticket} />
        {loading ? (
          [0, 1].map((i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-24 flex-1 rounded-lg" />
            </li>
          ))
        ) : messages?.length ? (
          messages.map((m) => <MessageItem key={m.id} message={m} />)
        ) : (
          <li className="relative flex items-center gap-3 pl-1 text-sm text-muted-foreground">
            <div className="relative z-10 flex size-6 items-center justify-center rounded-full border bg-background">
              <MessagesSquareIcon className="size-3.5" />
            </div>
            No replies or notes yet — the customer is waiting for a first response.
          </li>
        )}
      </ol>
    </section>
  )
}
